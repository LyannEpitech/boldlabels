import jsPDF from 'jspdf';
import type { Template, PDFOptions, LabelLayout } from '../types';

// MM_TO_PX = 3.7795275591

/**
 * Generate a PDF from Konva stage exports - WYSIWYG approach.
 * Instead of re-rendering everything in the backend, we capture
 * what the user sees in the preview and assemble it into a PDF.
 */

interface LabelImage {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Capture a Konva stage as a high-res PNG data URL
 */
export function captureStageAsImage(stage: any): string {
  return stage.toDataURL({
    pixelRatio: 3, // 3x for high quality (~288 DPI)
    mimeType: 'image/png',
  });
}

/**
 * Generate PDF from label images (captured from Konva stages)
 */
export function generatePDFFromImages(
  labelImages: LabelImage[],
  template: Template,
  pdfOptions: PDFOptions,
  labelLayout: LabelLayout,
): jsPDF {
  const doc = new jsPDF({
    unit: 'mm',
    format: pdfOptions.pageSize.toLowerCase() as any,
    orientation: pdfOptions.orientation as any,
  });

  const marginTop = pdfOptions.margins.top;
  const marginLeft = pdfOptions.margins.left;

  const labelWidth = template.width;
  const labelHeight = template.height;
  const hSpacing = labelLayout.horizontalSpacing;
  const vSpacing = labelLayout.verticalSpacing;
  const labelsPerRow = labelLayout.labelsPerRow;
  const labelsPerColumn = labelLayout.labelsPerColumn;
  const labelsPerPage = labelsPerRow * labelsPerColumn;

  let currentRow = 0;
  let currentCol = 0;
  let labelIndex = 0;

  for (const labelImage of labelImages) {
    // Add new page if needed
    if (labelIndex > 0 && labelIndex % labelsPerPage === 0) {
      doc.addPage();
      currentRow = 0;
      currentCol = 0;
    }

    const x = marginLeft + currentCol * (labelWidth + hSpacing);
    const y = marginTop + currentRow * (labelHeight + vSpacing);

    doc.addImage(
      labelImage.dataUrl,
      'PNG',
      x,
      y,
      labelWidth,
      labelHeight,
    );

    currentCol++;
    if (currentCol >= labelsPerRow) {
      currentCol = 0;
      currentRow++;
    }

    labelIndex++;
  }

  return doc;
}

/**
 * Download a jsPDF document
 */
export function downloadPDF(doc: jsPDF, filename: string = 'labels.pdf') {
  doc.save(filename);
}
