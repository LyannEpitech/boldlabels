import { jsPDF } from 'jspdf';
import type { Template, TemplateElement, PDFOptions, LabelLayout } from '../types';

// MM_TO_PT = 2.83465 - defined inline where needed

function withRotation(
  _doc: jsPDF,
  _element: TemplateElement,
  _x: number,
  _y: number,
  callback: () => void
): void {
  // jsPDF doesn't support rotation for individual elements easily
  // Rotation is applied via transformation matrix in advanced usage
  // For now, we skip rotation in PDF output or apply it via coordinate transformation
  callback();
}

interface GeneratePDFOptions {
  template: Template;
  csvData: string[][];
  csvHeaders: string[];
  mapping: Record<string, string>; // variableName -> columnName
  pdfOptions: PDFOptions;
  labelLayout: LabelLayout;
}

export async function generateLabelPDF({
  template,
  csvData,
  csvHeaders,
  mapping,
  pdfOptions,
  labelLayout,
}: GeneratePDFOptions): Promise<jsPDF> {
  const doc = new jsPDF({
    unit: 'mm',
    format: pdfOptions.pageSize.toLowerCase(),
    orientation: pdfOptions.orientation,
  });

  // Page dimensions
  // const pageWidth = doc.internal.pageSize.getWidth();
  // const pageHeight = doc.internal.pageSize.getHeight();

  // Available space (not used since we use template dimensions directly)
  // const availableWidth = pageWidth - pdfOptions.margins.left - pdfOptions.margins.right;
  // const availableHeight = pageHeight - pdfOptions.margins.top - pdfOptions.margins.bottom;

  // Use template dimensions directly, not calculated from available space
  const labelWidth = template.width;
  const labelHeight = template.height;

  let currentRow = 0;
  let currentCol = 0;

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];

    // New page if needed
    if (currentRow >= labelLayout.labelsPerColumn) {
      doc.addPage();
      currentRow = 0;
      currentCol = 0;
    }

    const x = pdfOptions.margins.left + currentCol * (labelWidth + labelLayout.horizontalSpacing);
    const y = pdfOptions.margins.top + currentRow * (labelHeight + labelLayout.verticalSpacing);

    // Draw label background
    doc.setFillColor(template.backgroundColor);
    doc.rect(x, y, labelWidth, labelHeight, 'F');

    // Draw label border
    if (template.borderWidth > 0) {
      doc.setDrawColor(template.borderColor);
      doc.setLineWidth(template.borderWidth);
      doc.rect(x, y, labelWidth, labelHeight, 'S');
    }

    // Draw elements
    for (const element of template.elements) {
      await drawElement(doc, element, row, csvHeaders, mapping, x, y);
    }

    currentCol++;
    if (currentCol >= labelLayout.labelsPerRow) {
      currentCol = 0;
      currentRow++;
    }
  }

  return doc;
}

async function drawElement(
  doc: jsPDF,
  element: TemplateElement,
  row: string[],
  _csvHeaders: string[],
  mapping: Record<string, string>,
  labelX: number,
  labelY: number
): Promise<void> {
  const columnName = mapping[element.variableName];
  let value = element.variableName;
  
  if (columnName) {
    const colIndex = _csvHeaders.indexOf(columnName);
    if (colIndex !== -1) {
      value = row[colIndex] || '';
    }
  }

  const elX = labelX + element.x;
  const elY = labelY + element.y;

  switch (element.type) {
    case 'text':
      drawTextElement(doc, element, value, elX, elY);
      break;
    case 'barcode':
      await drawBarcodeElement(doc, element, value, elX, elY);
      break;
    case 'qrcode':
      await drawQRCodeElement(doc, element, value, elX, elY);
      break;
    case 'image':
      await drawImageElement(doc, element, value, elX, elY);
      break;
    case 'rectangle':
      drawRectangleElement(doc, element, elX, elY);
      break;
  }
}

function drawTextElement(
  doc: jsPDF,
  element: TemplateElement,
  value: string,
  x: number,
  y: number
): void {
  const props = element.properties as any;
  
  // Vérification défensive des propriétés
  if (!props) {
    console.warn(`Properties undefined for element ${element.variableName}`);
    return;
  }

  // Map font family
  const fontMap: Record<string, string> = {
    'Arial': 'helvetica',
    'Helvetica': 'helvetica',
    'Times New Roman': 'times',
    'Courier New': 'courier',
    'Georgia': 'times',
    'Verdana': 'helvetica',
  };

  const fontFamily = fontMap[props.fontFamily] || 'helvetica';
  const fontStyle = props.fontWeight === 'bold' && props.fontStyle === 'italic'
    ? 'bolditalic'
    : props.fontWeight === 'bold'
    ? 'bold'
    : props.fontStyle === 'italic'
    ? 'italic'
    : 'normal';

  doc.setFont(fontFamily, fontStyle);
  doc.setFontSize(props.fontSize || 12);

  // Parse color
  const color = props.color || '#000000';
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  doc.setTextColor(r, g, b);

  const align = props.align || 'left';
  
  // Margins to keep text inside the element
  const margin = 1; // 1mm margin on each side
  const availableWidth = element.width - margin * 2;
  const availableHeight = element.height - margin * 2;
  
  // Use user-defined font size - truncate with ellipsis if too long
  const fontSize = props.fontSize || 12;
  doc.setFontSize(fontSize);
  
  // Truncate text with ellipsis if it exceeds available width
  let displayValue = value;
  let textWidth = doc.getTextWidth(displayValue);
  const ellipsis = '...';
  const ellipsisWidth = doc.getTextWidth(ellipsis);
  
  while (textWidth > availableWidth - ellipsisWidth && displayValue.length > 0) {
    displayValue = displayValue.slice(0, -1);
    textWidth = doc.getTextWidth(displayValue + ellipsis) + ellipsisWidth;
  }
  
  if (displayValue.length < value.length) {
    displayValue = displayValue + ellipsis;
  }
  
  console.log('[PDF] Text:', value.substring(0, 20), '→', displayValue.substring(0, 20), 'width:', textWidth, 'available:', availableWidth);
  
  const textX = align === 'center'
    ? x + element.width / 2
    : align === 'right'
    ? x + element.width - margin
    : x + margin;

  // Handle vertical align - jsPDF positions text by baseline
  const lineHeight = fontSize * 0.4; // Line height in mm (approx)
  
  // Split text to fit within available width
  const splitText = doc.splitTextToSize(value, availableWidth);
  
  // Calculate total text height
  const totalTextHeight = splitText.length * lineHeight;
  
  // Limit text to available height (truncate if too many lines)
  const maxLines = Math.floor(availableHeight / lineHeight);
  const finalText = splitText.slice(0, maxLines);
  
  // Calculate Y position based on vertical alignment
  let textY: number;
  if (props.verticalAlign === 'middle') {
    textY = y + margin + (availableHeight - totalTextHeight) / 2 + lineHeight * 0.7;
  } else if (props.verticalAlign === 'bottom') {
    textY = y + element.height - margin - (finalText.length - 1) * lineHeight;
  } else {
    // Top alignment
    textY = y + margin + lineHeight * 0.7;
  }
  
  doc.text(displayValue, textX, textY, {
    align: align as any,
  });
}

async function drawBarcodeElement(
  doc: jsPDF,
  element: TemplateElement,
  value: string,
  x: number,
  y: number
): Promise<void> {
  const props = element.properties as any;

  // Use JsBarcode to generate canvas
  const canvas = document.createElement('canvas');

  try {
    const JsBarcode = (await import('jsbarcode')).default;
    
    // Validate and format barcode value based on format
    const format = props.format || 'CODE128';
    let barcodeValue = value || '';
    
    // Ensure valid barcode value based on format
    if (!barcodeValue) {
      barcodeValue = format === 'EAN13' ? '1234567890128' : 
                    format === 'EAN8' ? '12345670' :
                    format === 'UPC' ? '123456789012' : 'TEST123';
    }
    
    // Validate EAN-13 (13 digits)
    if (format === 'EAN13' && !/^\d{13}$/.test(barcodeValue)) {
      // Try to pad or use default
      const digits = barcodeValue.replace(/\D/g, '');
      if (digits.length === 12) {
        // Calculate check digit
        const sum = digits.split('').reduce((acc, digit, i) => {
          return acc + parseInt(digit) * (i % 2 === 0 ? 1 : 3);
        }, 0);
        const checkDigit = (10 - (sum % 10)) % 10;
        barcodeValue = digits + checkDigit;
      } else if (digits.length !== 13) {
        barcodeValue = '1234567890128'; // Default valid EAN13
      }
    }
    
    // Validate EAN-8 (8 digits)
    if (format === 'EAN8' && !/^\d{8}$/.test(barcodeValue)) {
      const digits = barcodeValue.replace(/\D/g, '');
      if (digits.length !== 8) {
        barcodeValue = '12345670'; // Default valid EAN8
      }
    }
    
    // Validate UPC (12 digits)
    if (format === 'UPC' && !/^\d{12}$/.test(barcodeValue)) {
      const digits = barcodeValue.replace(/\D/g, '');
      if (digits.length !== 12) {
        barcodeValue = '123456789012'; // Default valid UPC
      }
    }
    
    // Calculate barcode height (leave space for text if displayed)
    const displayValue = props.displayValue !== false;
    const barcodeHeight = displayValue ? element.height * 0.7 : element.height * 0.9;
    
    // Use CODE128 as fallback for invalid formats
    const validFormat = ['EAN13', 'EAN8', 'UPC', 'CODE128'].includes(format) ? format : 'CODE128';
    
    JsBarcode(canvas, barcodeValue, {
      format: validFormat,
      width: 2,
      height: Math.max(30, barcodeHeight * 3), // Minimum 30px height
      displayValue: displayValue,
      fontSize: Math.min(14, Math.max(8, element.height * 0.15 * 3)),
      lineColor: props.lineColor || '#000000',
      background: props.backgroundColor || '#FFFFFF',
      margin: 0,
    });

    const imgData = canvas.toDataURL('image/png');
    withRotation(doc, element, x, y, () => {
      doc.addImage(imgData, 'PNG', x, y, element.width, element.height);
    });
  } catch (e) {
    // Fallback: draw placeholder
    console.error('Barcode error:', e);
    withRotation(doc, element, x, y, () => {
      doc.setDrawColor('#cccccc');
      doc.setFillColor('#f5f5f5');
      doc.rect(x, y, element.width, element.height, 'FD');
      doc.setTextColor('#999999');
      doc.setFontSize(8);
      doc.text('Invalid barcode', x + element.width / 2, y + element.height / 2, { align: 'center' });
    });
  }
}

async function drawQRCodeElement(
  doc: jsPDF,
  element: TemplateElement,
  value: string,
  x: number,
  y: number
): Promise<void> {
  const props = element.properties as any;

  try {
    const QRCode = await import('qrcode');
    const dataUrl = await QRCode.toDataURL(value || 'https://example.com', {
      width: 200,
      margin: 1,
      color: {
        dark: props.color || '#000000',
        light: props.backgroundColor || '#FFFFFF',
      },
      errorCorrectionLevel: (props.errorCorrectionLevel || 'M') as any,
    });

    withRotation(doc, element, x, y, () => {
      doc.addImage(dataUrl, 'PNG', x, y, element.width, element.height);
    });
  } catch (e) {
    // Fallback: draw placeholder
    withRotation(doc, element, x, y, () => {
      doc.setDrawColor('#cccccc');
      doc.setFillColor('#f5f5f5');
      doc.rect(x, y, element.width, element.height, 'FD');
      doc.setTextColor('#999999');
      doc.setFontSize(8);
      doc.text('Invalid QR', x + element.width / 2, y + element.height / 2, { align: 'center' });
    });
  }
}

async function drawImageElement(
  doc: jsPDF,
  element: TemplateElement,
  value: string,
  x: number,
  y: number
): Promise<void> {
  const props = element.properties as any;

  if (!props.src && !value) {
    // Draw placeholder
    withRotation(doc, element, x, y, () => {
      doc.setDrawColor('#cccccc');
      doc.setFillColor('#f5f5f5');
      doc.rect(x, y, element.width, element.height, 'FD');
      doc.setTextColor('#999999');
      doc.setFontSize(8);
      doc.text('No image', x + element.width / 2, y + element.height / 2, { align: 'center' });
    });
    return;
  }

  const src = value || props.src;

  try {
    // Check if it's a base64 image or URL
    if (src.startsWith('data:image')) {
      const format = src.includes('png') ? 'PNG' : 'JPEG';
      withRotation(doc, element, x, y, () => {
        doc.addImage(src, format, x, y, element.width, element.height);
      });
    } else if (src.startsWith('http')) {
      // For external URLs, we'd need to fetch and convert
      // For now, draw placeholder with URL
      withRotation(doc, element, x, y, () => {
        doc.setDrawColor('#cccccc');
        doc.rect(x, y, element.width, element.height, 'S');
        doc.setFontSize(6);
        doc.text('External image', x + 2, y + element.height / 2);
      });
    }
  } catch (e) {
    // Fallback
    withRotation(doc, element, x, y, () => {
      doc.setDrawColor('#ff0000');
      doc.setFillColor('#ffeeee');
      doc.rect(x, y, element.width, element.height, 'FD');
    });
  }
}

function drawRectangleElement(
  doc: jsPDF,
  element: TemplateElement,
  x: number,
  y: number
): void {
  const props = element.properties as any;

  withRotation(doc, element, x, y, () => {
    // Parse fill color
    const fillColor = props.fillColor || 'transparent';
    if (fillColor !== 'transparent') {
      const r = parseInt(fillColor.slice(1, 3), 16);
      const g = parseInt(fillColor.slice(3, 5), 16);
      const b = parseInt(fillColor.slice(5, 7), 16);
      doc.setFillColor(r, g, b);
    }

    // Parse stroke color
    const strokeColor = props.strokeColor || '#000000';
    const sr = parseInt(strokeColor.slice(1, 3), 16);
    const sg = parseInt(strokeColor.slice(3, 5), 16);
    const sb = parseInt(strokeColor.slice(5, 7), 16);
    doc.setDrawColor(sr, sg, sb);
    doc.setLineWidth(props.strokeWidth || 1);

    if (fillColor !== 'transparent') {
      doc.rect(x, y, element.width, element.height, 'FD');
    } else {
      doc.rect(x, y, element.width, element.height, 'S');
    }
  });
}
