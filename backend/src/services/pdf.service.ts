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

export async function generateLabelPDF({
  template,
  csvData,
  csvHeaders,
  mapping,
  pdfOptions,
  labelLayout,
}: GeneratePDFOptions): Promise<Buffer> {
  const doc = new jsPDF({
    unit: 'mm',
    format: pdfOptions.pageSize.toLowerCase(),
    orientation: pdfOptions.orientation,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const availableWidth = pageWidth - pdfOptions.margins.left - pdfOptions.margins.right;
  const availableHeight = pageHeight - pdfOptions.margins.top - pdfOptions.margins.bottom;

  const labelWidth = (availableWidth - (labelLayout.labelsPerRow - 1) * labelLayout.horizontalSpacing) / labelLayout.labelsPerRow;
  const labelHeight = (availableHeight - (labelLayout.labelsPerColumn - 1) * labelLayout.verticalSpacing) / labelLayout.labelsPerColumn;

  let currentRow = 0;
  let currentCol = 0;

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];

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
      const columnName = mapping[element.variableName];
      let value = element.variableName;
      if (columnName) {
        const colIndex = csvHeaders.indexOf(columnName);
        if (colIndex !== -1) {
          value = row[colIndex] || '';
        }
      }

      const elX = x + element.x;
      const elY = y + element.y;

      if (element.type === 'text') {
        const props = JSON.parse(element.properties);
        doc.setFont(props.fontFamily || 'helvetica');
        doc.setFontSize(props.fontSize || 12);
        doc.setTextColor(props.color || '#000000');
        
        const align = props.align || 'left';
        const textX = align === 'center' ? elX + element.width / 2 : align === 'right' ? elX + element.width : elX;
        
        doc.text(value, textX, elY + (props.fontSize || 12) * 0.35, {
          align: align as any,
          maxWidth: element.width,
        });
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
