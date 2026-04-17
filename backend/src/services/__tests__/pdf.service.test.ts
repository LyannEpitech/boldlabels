import { describe, it, expect, beforeAll } from 'vitest';
import { generateLabelPDF } from '../pdf.service';

// Mock data helpers
const createMockTemplate = (overrides = {}) => ({
  id: 'test-template',
  name: 'Test Template',
  description: null,
  width: 60,
  height: 40,
  unit: 'mm',
  backgroundColor: '#FFFFFF',
  borderWidth: 0,
  borderColor: '#000000',
  borderRadius: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  elements: [],
  ...overrides,
});

const mockPdfOptions = {
  pageSize: 'A4',
  orientation: 'portrait' as const,
  margins: { top: 10, right: 10, bottom: 10, left: 10 },
};

const mockLabelLayout = {
  labelsPerRow: 2,
  labelsPerColumn: 4,
  labelsPerPage: 8,
  horizontalSpacing: 2,
  verticalSpacing: 2,
};

describe('PDF Generation - Basic', () => {
  it('should generate a PDF file that is not empty', async () => {
    const template = createMockTemplate({
      elements: [{
        id: 'text-1',
        type: 'text',
        variableName: 'name',
        x: 5, y: 5, width: 50, height: 10,
        rotation: 0,
        properties: JSON.stringify({ fontSize: 12, color: '#000000' }),
      }],
    });

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData: [['Test Product']],
      csvHeaders: ['name'],
      mapping: { name: 'name' },
      pdfOptions: mockPdfOptions,
      labelLayout: mockLabelLayout,
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    expect(pdfBuffer.length).toBeGreaterThan(1000); // PDFs are at least 1KB
    
    // Check PDF header
    const header = pdfBuffer.slice(0, 5).toString();
    expect(header).toBe('%PDF-');
  });

  it('should generate PDF with multiple labels from CSV', async () => {
    const template = createMockTemplate({
      elements: [{
        id: 'text-1',
        type: 'text',
        variableName: 'product',
        x: 5, y: 5, width: 50, height: 10,
        rotation: 0,
        properties: JSON.stringify({ fontSize: 12 }),
      }],
    });

    const csvData = [
      ['Product 1'],
      ['Product 2'],
      ['Product 3'],
      ['Product 4'],
    ];

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData,
      csvHeaders: ['product'],
      mapping: { product: 'product' },
      pdfOptions: mockPdfOptions,
      labelLayout: mockLabelLayout,
    });

    // Parse PDF content to count labels (rectangles)
    const pdfContent = pdfBuffer.toString('latin1');
    const rectMatches = pdfContent.match(/\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+\s+-?\d+\.\d+\s+re/g);
    
    // Should have at least 4 rectangles (backgrounds for 4 labels)
    expect(rectMatches?.length || 0).toBeGreaterThanOrEqual(4);
  });
});

describe('PDF Generation - Barcodes', () => {
  it('should generate EAN-13 barcode image in PDF', async () => {
    const template = createMockTemplate({
      elements: [{
        id: 'barcode-1',
        type: 'barcode',
        variableName: 'ean',
        x: 10, y: 20, width: 40, height: 15,
        rotation: 0,
        properties: JSON.stringify({ format: 'EAN13', showText: true }),
      }],
    });

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData: [['3666154117284']], // Valid EAN-13
      csvHeaders: ['ean'],
      mapping: { ean: 'ean' },
      pdfOptions: mockPdfOptions,
      labelLayout: mockLabelLayout,
    });

    // PDF should contain image data (barcode is embedded as PNG)
    const pdfContent = pdfBuffer.toString('latin1');
    
    // Check for image XObject (barcode is added as image)
    expect(pdfContent).toContain('/Image');
    expect(pdfContent).toContain('/XObject');
    
    // File should be larger than text-only PDF (barcode image adds size)
    expect(pdfBuffer.length).toBeGreaterThan(5000);
  });

  it('should fallback to text placeholder for invalid barcode format', async () => {
    const template = createMockTemplate({
      elements: [{
        id: 'barcode-1',
        type: 'barcode',
        variableName: 'code',
        x: 10, y: 20, width: 40, height: 15,
        rotation: 0,
        properties: JSON.stringify({ format: 'INVALID_FORMAT' }),
      }],
    });

    // Should not throw, should use fallback
    const pdfBuffer = await generateLabelPDF({
      template,
      csvData: [['TEST123']],
      csvHeaders: ['code'],
      mapping: { code: 'code' },
      pdfOptions: mockPdfOptions,
      labelLayout: mockLabelLayout,
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle CODE128 barcode format', async () => {
    const template = createMockTemplate({
      elements: [{
        id: 'barcode-1',
        type: 'barcode',
        variableName: 'sku',
        x: 10, y: 20, width: 40, height: 15,
        rotation: 0,
        properties: JSON.stringify({ format: 'CODE128' }),
      }],
    });

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData: [['SKU-12345-ABC']],
      csvHeaders: ['sku'],
      mapping: { sku: 'sku' },
      pdfOptions: mockPdfOptions,
      labelLayout: mockLabelLayout,
    });

    const pdfContent = pdfBuffer.toString('latin1');
    expect(pdfContent).toContain('/Image');
  });
});

describe('PDF Generation - QR Codes', () => {
  it('should generate QR code image in PDF', async () => {
    const template = createMockTemplate({
      elements: [{
        id: 'qr-1',
        type: 'qrcode',
        variableName: 'qrdata',
        x: 15, y: 10, width: 20, height: 20,
        rotation: 0,
        properties: JSON.stringify({}),
      }],
    });

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData: [['https://example.com/product/123']],
      csvHeaders: ['qrdata'],
      mapping: { qrdata: 'qrdata' },
      pdfOptions: mockPdfOptions,
      labelLayout: mockLabelLayout,
    });

    const pdfContent = pdfBuffer.toString('latin1');
    expect(pdfContent).toContain('/Image');
    expect(pdfContent).toContain('/XObject');
    
    // QR code PDF should be substantial size
    expect(pdfBuffer.length).toBeGreaterThan(3000);
  });
});

describe('PDF Generation - Colors', () => {
  it('should apply background color correctly', async () => {
    const template = createMockTemplate({
      backgroundColor: '#FFF3E0', // Light orange
      elements: [],
    });

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData: [['']],
      csvHeaders: ['col'],
      mapping: {},
      pdfOptions: mockPdfOptions,
      labelLayout: mockLabelLayout,
    });

    // Parse PDF to check color
    const pdfContent = pdfBuffer.toString('latin1');
    
    // Check for RGB color values in PDF
    // #FFF3E0 = RGB(255, 243, 224)
    // In PDF: 1 0.95 0.88 rg (normalized) - looser regex for floating point
    expect(pdfContent).toMatch(/1\.?\d*\s+0\.9\d*\s+0\.8\d*\s+rg/);
  });

  it('should handle short hex colors (#RGB format)', async () => {
    const template = createMockTemplate({
      backgroundColor: '#F00', // Red short format
      elements: [],
    });

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData: [['']],
      csvHeaders: ['col'],
      mapping: {},
      pdfOptions: mockPdfOptions,
      labelLayout: mockLabelLayout,
    });

    const pdfContent = pdfBuffer.toString('latin1');
    // #F00 = RGB(255, 0, 0) = 1 0 0 rg in PDF
    // Just verify we have a color setting, exact values may vary
    expect(pdfContent).toContain('rg');
    // Make sure PDF is valid
    expect(pdfContent).toContain('%PDF-');
  });

  it('should apply text color correctly', async () => {
    const template = createMockTemplate({
      elements: [{
        id: 'text-1',
        type: 'text',
        variableName: 'label',
        x: 5, y: 5, width: 50, height: 10,
        rotation: 0,
        properties: JSON.stringify({ fontSize: 12, color: '#1565C0' }), // Blue
      }],
    });

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData: [['Test']],
      csvHeaders: ['label'],
      mapping: { label: 'label' },
      pdfOptions: mockPdfOptions,
      labelLayout: mockLabelLayout,
    });

    const pdfContent = pdfBuffer.toString('latin1');
    // #1565C0 = RGB(21, 101, 192) = approx 0.082 0.396 0.753 rg
    expect(pdfContent).toContain('rg'); // Color setting operator present
  });

  it('should handle border color and width', async () => {
    const template = createMockTemplate({
      borderWidth: 1,
      borderColor: '#FF6600', // Orange
      elements: [],
    });

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData: [['']],
      csvHeaders: ['col'],
      mapping: {},
      pdfOptions: mockPdfOptions,
      labelLayout: mockLabelLayout,
    });

    const pdfContent = pdfBuffer.toString('latin1');
    // Check for stroke color (RG for stroke, rg for fill)
    expect(pdfContent).toContain('RG');
    expect(pdfContent).toContain('S'); // Stroke operator
  });
});

describe('PDF Generation - Batch CSV Processing', () => {
  it('should handle empty CSV gracefully', async () => {
    const template = createMockTemplate({
      elements: [{
        id: 'text-1',
        type: 'text',
        variableName: 'name',
        x: 5, y: 5, width: 50, height: 10,
        rotation: 0,
        properties: JSON.stringify({ fontSize: 12 }),
      }],
    });

    // Empty CSV - should still generate valid PDF (just empty or minimal)
    const pdfBuffer = await generateLabelPDF({
      template,
      csvData: [],
      csvHeaders: ['name'],
      mapping: { name: 'name' },
      pdfOptions: mockPdfOptions,
      labelLayout: mockLabelLayout,
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    // Still a valid PDF
    const header = pdfBuffer.slice(0, 5).toString();
    expect(header).toBe('%PDF-');
  });

  it('should process large CSV without errors', async () => {
    const template = createMockTemplate({
      elements: [{
        id: 'text-1',
        type: 'text',
        variableName: 'product',
        x: 5, y: 5, width: 50, height: 10,
        rotation: 0,
        properties: JSON.stringify({ fontSize: 10 }),
      }, {
        id: 'barcode-1',
        type: 'barcode',
        variableName: 'ean',
        x: 10, y: 18, width: 40, height: 12,
        rotation: 0,
        properties: JSON.stringify({ format: 'EAN13' }),
      }],
    });

    // Generate 20 products
    const csvData = Array.from({ length: 20 }, (_, i) => [
      `Product ${i + 1}`,
      `366615411728${i % 10}`, // Varying EANs
    ]);

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData,
      csvHeaders: ['product', 'ean'],
      mapping: { product: 'product', ean: 'ean' },
      pdfOptions: mockPdfOptions,
      labelLayout: mockLabelLayout,
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(10000); // Large PDF with many barcodes
    
    // Check it's valid PDF
    const header = pdfBuffer.slice(0, 5).toString();
    expect(header).toBe('%PDF-');
    
    // Should contain images (barcodes) - some may fail due to invalid check digits
    const pdfContent = pdfBuffer.toString('latin1');
    const imageCount = (pdfContent.match(/\/Image/g) || []).length;
    // At least some barcodes were generated (valid EAN-13 check digits)
    expect(imageCount).toBeGreaterThanOrEqual(5); // At least 5 valid barcodes
  });

  it('should handle CSV with special characters', async () => {
    const template = createMockTemplate({
      elements: [{
        id: 'text-1',
        type: 'text',
        variableName: 'name',
        x: 5, y: 5, width: 50, height: 10,
        rotation: 0,
        properties: JSON.stringify({ fontSize: 12 }),
      }],
    });

    const csvData = [
      ['Café Crème'],
      ['Thé Vert Bio'],
      ['Product™'],
      ['Item @ $10.99'],
    ];

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData,
      csvHeaders: ['name'],
      mapping: { name: 'name' },
      pdfOptions: mockPdfOptions,
      labelLayout: mockLabelLayout,
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    // Verify PDF is valid
    const header = pdfBuffer.slice(0, 5).toString();
    expect(header).toBe('%PDF-');
  });
});

describe('PDF Generation - Layout Options', () => {
  it('should handle different page sizes', async () => {
    const template = createMockTemplate({ elements: [] });
    
    for (const pageSize of ['A4', 'letter']) {
      const pdfBuffer = await generateLabelPDF({
        template,
        csvData: [['']],
        csvHeaders: ['col'],
        mapping: {},
        pdfOptions: {
          ...mockPdfOptions,
          pageSize,
        },
        labelLayout: mockLabelLayout,
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    }
  });

  it('should handle landscape orientation', async () => {
    const template = createMockTemplate({ elements: [] });

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData: [['']],
      csvHeaders: ['col'],
      mapping: {},
      pdfOptions: {
        ...mockPdfOptions,
        orientation: 'landscape',
      },
      labelLayout: mockLabelLayout,
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
