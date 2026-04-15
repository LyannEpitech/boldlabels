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

// Convert mm to points (jsPDF uses points with unit: 'pt')
const MM_TO_PT = 2.83465;

// Convert pt to px (for font size consistency with preview)
const PT_TO_PX = 1.333;

// Helper to apply rotation in PDF
// Note: jsPDF doesn't have built-in rotation support for individual elements
// This is a simplified implementation that rotates the coordinate system
function applyRotation(doc: jsPDF, x: number, y: number, width: number, height: number, rotation: number, callback: () => void) {
  if (!rotation || rotation === 0) {
    callback();
    return;
  }
  
  // For now, rotation is not fully implemented in PDF
  // The element will be drawn without rotation
  // TODO: Implement proper PDF rotation using transformation matrices
  callback();
}

export async function generateLabelPDF({
  template,
  csvData,
  csvHeaders,
  mapping,
  pdfOptions,
  labelLayout,
}: GeneratePDFOptions): Promise<Buffer> {
  // Use mm as unit (jsPDF will convert to points internally)
  const doc = new jsPDF({
    unit: 'mm',
    format: pdfOptions.pageSize.toLowerCase(),
    orientation: pdfOptions.orientation,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Margins are already in mm
  const marginTop = pdfOptions.margins.top;
  const marginRight = pdfOptions.margins.right;
  const marginBottom = pdfOptions.margins.bottom;
  const marginLeft = pdfOptions.margins.left;

  const availableWidth = pageWidth - marginLeft - marginRight;
  const availableHeight = pageHeight - marginTop - marginBottom;

  // Template dimensions are already in mm
  const labelWidth = template.width;
  const labelHeight = template.height;

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

    // Validate layout parameters to prevent division by zero
    const labelsPerRow = Math.max(1, labelLayout.labelsPerRow || 1);
    const labelsPerColumn = Math.max(1, labelLayout.labelsPerColumn || 1);
    
    // Spacing is already in mm
    const horizontalSpacing = labelLayout.horizontalSpacing;
    const verticalSpacing = labelLayout.verticalSpacing;
    
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

      // Element position relative to label (already in mm)
      const elX = x + element.x;
      const elY = y + element.y;
      const elWidth = element.width;
      const elHeight = element.height;

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
        
        // jsPDF setFontSize always expects points, regardless of unit setting
        // The fontSize in props is in pt, so use it directly
        const fontSizePt = props.fontSize || 12;
        doc.setFontSize(fontSizePt);
        doc.setTextColor(props.color || '#000000');
        
        const align = props.align || 'left';
        const textX = align === 'center' ? elX + elWidth / 2 : 
                     align === 'right' ? elX + elWidth : elX;
        
        // Calculate vertical position based on verticalAlign
        // Preview uses Konva's verticalAlign which handles baseline automatically
        // For PDF, we need to adjust based on font metrics
        // Convert pt to mm for positioning calculations
        const fontSizeMm = fontSizePt * 0.3528;
        let textY = elY;
        const verticalAlign = props.verticalAlign || 'top';
        
        if (verticalAlign === 'middle') {
          textY = elY + elHeight / 2 + fontSizeMm * 0.35;
        } else if (verticalAlign === 'bottom') {
          textY = elY + elHeight - fontSizeMm * 0.1;
        } else {
          // top - add small offset for baseline
          textY = elY + fontSizeMm * 0.35;
        }
        
        // Apply rotation if needed
        if (element.rotation) {
          applyRotation(doc, elX, elY, elWidth, elHeight, element.rotation, () => {
            doc.text(String(value), textX - elX, textY - elY, {
              align: align as any,
              maxWidth: elWidth,
            });
          });
        } else {
          doc.text(String(value), textX, textY, {
            align: align as any,
            maxWidth: elWidth,
          });
        }
      } else if (element.type === 'barcode') {
        // Draw barcode placeholder with value
        const drawBarcode = () => {
          doc.setDrawColor(props.lineColor || '#000000');
          doc.setFillColor(props.backgroundColor || '#FFFFFF');
          doc.rect(elX, elY, elWidth, elHeight, 'FD');
          
          doc.setFont('helvetica');
          doc.setFontSize(8);
          doc.setTextColor(props.lineColor || '#000000');
          doc.text(String(value).substring(0, 20), elX + 2, elY + elHeight / 2);
        };
        
        if (element.rotation) {
          applyRotation(doc, elX, elY, elWidth, elHeight, element.rotation, drawBarcode);
        } else {
          drawBarcode();
        }
        
        // Note: Real barcode generation would require a barcode library
        // For now, we display the value as text
      } else if (element.type === 'qrcode') {
        // Draw QR placeholder
        const drawQR = () => {
          doc.setDrawColor(props.color || '#000000');
          doc.setFillColor(props.backgroundColor || '#FFFFFF');
          doc.rect(elX, elY, elWidth, elHeight, 'FD');
          
          doc.setFontSize(6);
          doc.setTextColor(props.color || '#000000');
          doc.text('QR', elX + elWidth / 2 - 3, elY + elHeight / 2);
        };
        
        if (element.rotation) {
          applyRotation(doc, elX, elY, elWidth, elHeight, element.rotation, drawQR);
        } else {
          drawQR();
        }
      } else if (element.type === 'rectangle') {
        const drawRect = () => {
          doc.setDrawColor(props.strokeColor || '#000000');
          doc.setFillColor(props.fillColor || 'transparent');
          doc.setLineWidth((props.strokeWidth || 1) * MM_TO_PT);
          
          if (props.fillColor && props.fillColor !== 'transparent') {
            doc.rect(elX, elY, elWidth, elHeight, 'FD');
          } else {
            doc.rect(elX, elY, elWidth, elHeight, 'S');
          }
        };
        
        if (element.rotation) {
          applyRotation(doc, elX, elY, elWidth, elHeight, element.rotation, drawRect);
        } else {
          drawRect();
        }
      } else if (element.type === 'image') {
        // Image placeholder
        const drawImage = () => {
          doc.setDrawColor('#CCCCCC');
          doc.rect(elX, elY, elWidth, elHeight, 'S');
          doc.setFontSize(8);
          doc.setTextColor('#999999');
          doc.text('IMG', elX + elWidth / 2 - 5, elY + elHeight / 2);
        };
        
        if (element.rotation) {
          applyRotation(doc, elX, elY, elWidth, elHeight, element.rotation, drawImage);
        } else {
          drawImage();
        }
      }
    }

    currentCol++;
    if (currentCol >= labelsPerRow) {
      currentCol = 0;
      currentRow++;
    }
  }

  return Buffer.from(doc.output('arraybuffer'));
}
