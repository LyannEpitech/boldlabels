import { jsPDF } from 'jspdf';
import bwipjs from 'bwip-js';
import QRCode from 'qrcode';
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

// Helper: parse hex color to RGB array for jsPDF
// Supports: #FFF, #FFFFFF, FFF, FFFFFF
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  
  // Handle short hex (#FFF -> #FFFFFF)
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  
  // Default to white if invalid
  if (h.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(h)) {
    console.warn(`[PDF Service] Invalid hex color: ${hex}, defaulting to white`);
    return [255, 255, 255];
  }
  
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

// Valid barcode formats supported by bwip-js
const VALID_BARCODE_FORMATS = [
  'EAN13', 'EAN-13', 'EAN8', 'EAN-8',
  'UPC-A', 'UPCA', 'UPC-E', 'UPCE',
  'CODE128', 'CODE-128', 'CODE39', 'CODE-39',
  'ITF14', 'ITF-14', 'CODE93', 'CODE-93',
  'CODABAR', 'MSI', 'GS1', 'ISBN', 'ISMN', 'ISSN'
];

// Map format names to bwip-js bcid
const BARCODE_FORMAT_MAP: Record<string, string> = {
  'EAN13': 'ean13', 'EAN-13': 'ean13',
  'EAN8': 'ean8', 'EAN-8': 'ean8',
  'UPC-A': 'upca', 'UPCA': 'upca',
  'UPC-E': 'upce', 'UPCE': 'upce',
  'CODE128': 'code128', 'CODE-128': 'code128',
  'CODE39': 'code39', 'CODE-39': 'code39',
  'CODE93': 'code93', 'CODE-93': 'code93',
  'ITF14': 'itf14', 'ITF-14': 'itf14',
  'CODABAR': 'rationalizedCodabar',
  'MSI': 'msi', 'GS1': 'gs1-128',
  'ISBN': 'isbn', 'ISMN': 'ismn', 'ISSN': 'issn',
};

// Generate barcode as PNG buffer using bwip-js
async function generateBarcodePNG(value: string, format: string): Promise<Buffer> {
  const upperFormat = format.toUpperCase();
  
  // Validate format
  if (!VALID_BARCODE_FORMATS.includes(upperFormat)) {
    const error = new Error(`Unsupported barcode format: ${format}. Supported: ${VALID_BARCODE_FORMATS.join(', ')}`);
    console.error(`[PDF Service] Barcode format error: ${format}`);
    throw error;
  }
  
  const bcid = BARCODE_FORMAT_MAP[upperFormat] || 'code128';
  
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({
      bcid,
      text: value,
      scale: 3,
      includetext: true,
      textxalign: 'center',
    }, (err: string | Error | null, png: Buffer) => {
      if (err) {
        const errorMsg = typeof err === 'string' ? err : err.message;
        console.error(`[PDF Service] Barcode generation failed: ${errorMsg}`);
        reject(new Error(errorMsg));
      } else {
        resolve(png);
      }
    });
  });
}

// Generate QR code as PNG buffer
async function generateQRPNG(value: string, sizeMm: number): Promise<Buffer> {
  // Convert mm to pixels at 300 DPI for print quality
  // 1 inch = 25.4mm, 300 DPI → pixels = mm * 300 / 25.4
  const pixels = Math.max(100, Math.round(sizeMm * 11.81));
  
  return await QRCode.toBuffer(value, {
    width: pixels,
    margin: 0,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
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

  const marginTop = pdfOptions.margins.top;
  const marginRight = pdfOptions.margins.right;
  const marginBottom = pdfOptions.margins.bottom;
  const marginLeft = pdfOptions.margins.left;

  const labelWidth = template.width;
  const labelHeight = template.height;

  let currentRow = 0;
  let currentCol = 0;

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];

    if (currentRow >= labelLayout.labelsPerColumn) {
      doc.addPage();
      currentRow = 0;
      currentCol = 0;
    }

    const labelsPerRow = Math.max(1, labelLayout.labelsPerRow || 1);
    const horizontalSpacing = labelLayout.horizontalSpacing;
    const verticalSpacing = labelLayout.verticalSpacing;

    const x = marginLeft + currentCol * (labelWidth + horizontalSpacing);
    const y = marginTop + currentRow * (labelHeight + verticalSpacing);

    // Draw label background with proper hex color parsing
    const bgColor = hexToRgb(template.backgroundColor || '#FFFFFF');
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(x, y, labelWidth, labelHeight, 'F');

    // Draw label border
    if (template.borderWidth > 0) {
      const borderColor = hexToRgb(template.borderColor || '#000000');
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
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
      const elWidth = element.width;
      const elHeight = element.height;

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
        const fontSizePt = props.fontSize || 12;
        doc.setFontSize(fontSizePt);
        const textColor = hexToRgb(props.color || '#000000');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);

        const align = props.align || 'left';
        const textX = align === 'center' ? elX + elWidth / 2 :
                     align === 'right' ? elX + elWidth : elX;

        const fontSizeMm = fontSizePt * 0.3528;
        let textY = elY;
        const verticalAlign = props.verticalAlign || 'top';

        if (verticalAlign === 'middle') {
          textY = elY + elHeight / 2 + fontSizeMm * 0.35;
        } else if (verticalAlign === 'bottom') {
          textY = elY + elHeight - fontSizeMm * 0.1;
        } else {
          textY = elY + fontSizeMm * 0.35;
        }

        if (element.rotation) {
          // Save graphics state, rotate, draw, restore
          doc.saveGraphicsState();
          doc.setCurrentTransformationMatrix(
            doc.Matrix(1, 0, 0, 1, elX + elWidth / 2, elY + elHeight / 2)
          );
          doc.setCurrentTransformationMatrix(
            doc.Matrix(
              Math.cos(element.rotation * Math.PI / 180),
              Math.sin(element.rotation * Math.PI / 180),
              -Math.sin(element.rotation * Math.PI / 180),
              Math.cos(element.rotation * Math.PI / 180),
              0, 0
            )
          );
          doc.text(String(value), -elWidth / 2 + (textX - elX), -elHeight / 2 + (textY - elY), {
            align: align as any,
            maxWidth: elWidth,
          });
          doc.restoreGraphicsState();
        } else {
          doc.text(String(value), textX, textY, {
            align: align as any,
            maxWidth: elWidth,
          });
        }
      } else if (element.type === 'barcode') {
        try {
          const barcodeFormat = props.format || 'CODE128';
          const barcodePNG = await generateBarcodePNG(String(value), barcodeFormat);
          
          doc.addImage(barcodePNG, 'PNG', elX, elY, elWidth, elHeight);
        } catch (e: any) {
          console.warn(`[PDF Service] Barcode fallback for "${value}": ${e.message}`);
          // Fallback: draw text placeholder
          const lineColor = hexToRgb(props.lineColor || '#000000');
          const bgColor = hexToRgb(props.backgroundColor || '#FFFFFF');
          doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
          doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
          doc.rect(elX, elY, elWidth, elHeight, 'FD');
          doc.setFont('helvetica');
          doc.setFontSize(8);
          doc.setTextColor(lineColor[0], lineColor[1], lineColor[2]);
          doc.text(String(value).substring(0, 20), elX + 2, elY + elHeight / 2);
        }
      } else if (element.type === 'qrcode') {
        try {
          const qrSize = Math.min(elWidth, elHeight);
          const qrPNG = await generateQRPNG(String(value), qrSize);
          const offsetX = elX + (elWidth - qrSize) / 2;
          const offsetY = elY + (elHeight - qrSize) / 2;
          doc.addImage(qrPNG, 'PNG', offsetX, offsetY, qrSize, qrSize);
        } catch (e: any) {
          console.warn(`[PDF Service] QR code fallback for "${value}": ${e.message}`);
          // Fallback
          doc.setDrawColor('#000000');
          doc.rect(elX, elY, elWidth, elHeight, 'S');
          doc.setFontSize(6);
          doc.text('QR', elX + elWidth / 2 - 3, elY + elHeight / 2);
        }
      } else if (element.type === 'rectangle') {
        if (props.fillColor && props.fillColor !== 'transparent') {
          const fill = hexToRgb(props.fillColor);
          doc.setFillColor(fill[0], fill[1], fill[2]);
          doc.setDrawColor(...hexToRgb(props.strokeColor || '#000000'));
          doc.setLineWidth(props.strokeWidth || 1);
          doc.rect(elX, elY, elWidth, elHeight, 'FD');
        } else {
          doc.setDrawColor(...hexToRgb(props.strokeColor || '#000000'));
          doc.setLineWidth(props.strokeWidth || 1);
          doc.rect(elX, elY, elWidth, elHeight, 'S');
        }
      } else if (element.type === 'image') {
        // Image placeholder - draw border
        doc.setDrawColor(204, 204, 204);
        doc.rect(elX, elY, elWidth, elHeight, 'S');
        doc.setFontSize(8);
        doc.setTextColor(153, 153, 153);
        doc.text('IMG', elX + elWidth / 2, elY + elHeight / 2, { align: 'center' });
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
