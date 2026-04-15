import { jsPDF } from 'jspdf';
import type { Template } from '@prisma/client';

interface PDFOptions {
  pageSize: string;
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
}

interface LabelLayout {
  labelsPerRow: number;
  labelsPerColumn: number;
  labelsPerPage: number;
  horizontalSpacing: number;
  verticalSpacing: number;
}

interface GeneratePDFOptions {
  template: Template & { elements: any[] };
  csvData: string[][];
  csvHeaders: string[];
  mapping: Record<string, string>;
  pdfOptions: PDFOptions;
  labelLayout: LabelLayout;
}

// Convert mm to points (jsPDF uses points by default with unit: 'mm')
const MM_TO_PT = 2.83465;

export async function generateLabelPDF({
  template,
  csvData,
  csvHeaders,
  mapping,
  pdfOptions,
  labelLayout,
}: GeneratePDFOptions): Promise<Buffer> {
  // Use points as unit to have better control over scaling
  const doc = new jsPDF({
    unit: 'pt',
    format: pdfOptions.pageSize.toLowerCase(),
    orientation: pdfOptions.orientation,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Convert margins from mm to pt
  const marginTop = pdfOptions.margins.top * MM_TO_PT;
  const marginRight = pdfOptions.margins.right * MM_TO_PT;
  const marginBottom = pdfOptions.margins.bottom * MM_TO_PT;
  const marginLeft = pdfOptions.margins.left * MM_TO_PT;

  const availableWidth = pageWidth - marginLeft - marginRight;
  const availableHeight = pageHeight - marginTop - marginBottom;

  // Convert template dimensions from mm to pt
  const labelWidth = template.width * MM_TO_PT;
  const labelHeight = template.height * MM_TO_PT;

  let currentRow = 0;
  let currentCol = 0;

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];

    // Check if we need a new page
    if (currentRow >= labelLayout.labelsPerColumn) {
      doc.addPage();
      currentRow = 0;
      currentCol = 0;
    }

    // Convert spacing from mm to pt
    const horizontalSpacing = labelLayout.horizontalSpacing * MM_TO_PT;
    const verticalSpacing = labelLayout.verticalSpacing * MM_TO_PT;
    
    const x = marginLeft + currentCol * (labelWidth + horizontalSpacing);
    const y = marginTop + currentRow * (labelHeight + verticalSpacing);

    // Draw label background
    doc.setFillColor(template.backgroundColor);
    doc.rect(x, y, labelWidth, labelHeight, 'F');

    // Draw label border
    if (template.borderWidth > 0) {
      doc.setDrawColor(template.borderColor);
      doc.setLineWidth(template.borderWidth * MM_TO_PT);
      doc.rect(x, y, labelWidth, labelHeight, 'S');
    }

    // Draw elements
    for (const element of template.elements) {
      const columnName = mapping[element.variableName];
      let value = element.variableName;
      if (columnName) {
        const colIndex = csvHeaders.indexOf(columnName);
        if (colIndex !== -1) {
          value = row[colIndex] || '';
        }
      }

      // Element position relative to label (convert mm to pt)
      const elX = x + element.x * MM_TO_PT;
      const elY = y + element.y * MM_TO_PT;
      const elWidth = element.width * MM_TO_PT;
      const elHeight = element.height * MM_TO_PT;

      // Parse properties (handle both string and object)
      let props: any = {};
      try {
        props = typeof element.properties === 'string' 
          ? JSON.parse(element.properties) 
          : element.properties || {};
      } catch (e) {
        props = {};
      }

      if (element.type === 'text') {
        doc.setFont(props.fontFamily || 'helvetica');
        // fontSize is in pt, use directly
        doc.setFontSize(props.fontSize || 12);
        doc.setTextColor(props.color || '#000000');
        
        const align = props.align || 'left';
        const textX = align === 'center' ? elX + elWidth / 2 : 
                     align === 'right' ? elX + elWidth : elX;
        
        // Offset Y to align with preview (jsPDF positions from baseline)
        const baselineOffset = (props.fontSize || 12) * 0.35;
        
        doc.text(String(value), textX, elY + baselineOffset, {
          align: align as any,
          maxWidth: elWidth,
        });
      } else if (element.type === 'barcode') {
        // Draw barcode placeholder with value
        doc.setDrawColor(props.lineColor || '#000000');
        doc.setFillColor(props.backgroundColor || '#FFFFFF');
        doc.rect(elX, elY, elWidth, elHeight, 'FD');
        
        doc.setFont('helvetica');
        doc.setFontSize(8);
        doc.setTextColor(props.lineColor || '#000000');
        doc.text(String(value).substring(0, 20), elX + 2, elY + elHeight / 2);
        
        // Note: Real barcode generation would require a barcode library
        // For now, we display the value as text
      } else if (element.type === 'qrcode') {
        // Draw QR placeholder
        doc.setDrawColor(props.color || '#000000');
        doc.setFillColor(props.backgroundColor || '#FFFFFF');
        doc.rect(elX, elY, elWidth, elHeight, 'FD');
        
        doc.setFontSize(6);
        doc.setTextColor(props.color || '#000000');
        doc.text('QR', elX + elWidth / 2 - 3, elY + elHeight / 2);
      } else if (element.type === 'rectangle') {
        doc.setDrawColor(props.strokeColor || '#000000');
        doc.setFillColor(props.fillColor || 'transparent');
        doc.setLineWidth((props.strokeWidth || 1) * MM_TO_PT);
        
        if (props.fillColor && props.fillColor !== 'transparent') {
          doc.rect(elX, elY, elWidth, elHeight, 'FD');
        } else {
          doc.rect(elX, elY, elWidth, elHeight, 'S');
        }
      } else if (element.type === 'image') {
        // Image placeholder
        doc.setDrawColor('#CCCCCC');
        doc.rect(elX, elY, elWidth, elHeight, 'S');
        doc.setFontSize(8);
        doc.setTextColor('#999999');
        doc.text('IMG', elX + elWidth / 2 - 5, elY + elHeight / 2);
      }
    }

    currentCol++;
    if (currentCol >= labelLayout.labelsPerRow) {
      currentCol = 0;
      currentRow++;
    }
  }

  return Buffer.from(doc.output('arraybuffer'));
}
