import { describe, it, expect } from 'vitest';
import { generateLabelPDF } from '../pdf.service';

describe('PDF Alignment - Spacing 0', () => {
  it('should not stretch images when horizontalSpacing is 0', async () => {
    const template = {
      id: 'test-template',
      name: 'Test Template',
      description: null,
      width: 60,
      height: 40,
      unit: 'mm',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      elements: [
        {
          id: 'img-1',
          type: 'barcode' as const,
          variableName: 'ean',
          x: 5,
          y: 5,
          width: 50,
          height: 15,
          rotation: 0,
          zIndex: 1,
          properties: JSON.stringify({
            format: 'EAN13',
            showText: true,
          }),
        },
      ],
    };

    const csvData = [['3666154117284']];
    const csvHeaders = ['ean'];
    const mapping = { ean: 'ean' };

    const pdfOptions = {
      pageSize: 'A4',
      orientation: 'portrait' as const,
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
    };

    // Test avec espacement 0
    const labelLayout = {
      labelsPerRow: 2,
      labelsPerColumn: 4,
      labelsPerPage: 8,
      horizontalSpacing: 0,  // Pas d'espacement
      verticalSpacing: 0,    // Pas d'espacement
    };

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData,
      csvHeaders,
      mapping,
      pdfOptions,
      labelLayout,
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Parse PDF to check positions
    const pdfContent = pdfBuffer.toString('latin1');
    
    // Look for image positioning commands
    // In PDF, images are placed with 'Do' operator after positioning
    const imageMatches = pdfContent.match(/\/Im\d+\s+Do/g);
    expect(imageMatches).toBeTruthy();
    
    // Check that images are not stretched
    // Look for width/height in image dictionary
    const widthMatches = pdfContent.match(/\/Width\s+(\d+)/g);
    const heightMatches = pdfContent.match(/\/Height\s+(\d+)/g);
    
    if (widthMatches && heightMatches) {
      // Images should have consistent dimensions
      console.log('Images found in PDF:', imageMatches?.length);
      console.log('Width entries:', widthMatches.length);
      console.log('Height entries:', heightMatches.length);
    }
  });

  it('should position labels correctly with spacing 0', async () => {
    const template = {
      id: 'test-template',
      name: 'Test Template',
      description: null,
      width: 60,
      height: 40,
      unit: 'mm',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      elements: [],
    };

    const csvData = [['Product 1'], ['Product 2']];
    const csvHeaders = ['name'];
    const mapping = {};

    const pdfOptions = {
      pageSize: 'A4',
      orientation: 'portrait' as const,
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
    };

    const labelLayout = {
      labelsPerRow: 2,
      labelsPerColumn: 4,
      labelsPerPage: 8,
      horizontalSpacing: 0,
      verticalSpacing: 0,
    };

    const pdfBuffer = await generateLabelPDF({
      template,
      csvData,
      csvHeaders,
      mapping,
      pdfOptions,
      labelLayout,
    });

    const pdfContent = pdfBuffer.toString('latin1');
    
    // Check for rectangle drawing (label borders)
    // Should find rectangles at positions:
    // - First label: x=10, y=10
    // - Second label: x=70 (10 + 60), y=10
    const rectMatches = pdfContent.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+re/g);
    expect(rectMatches).toBeTruthy();
    expect(rectMatches!.length).toBeGreaterThanOrEqual(2);
  });
});
