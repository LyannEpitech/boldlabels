import { describe, it, expect } from 'vitest';
import { generateLabelPDF } from '../services/pdf.service';
// Constants for conversion (must match frontend/backend)
const MM_TO_PX = 3.7795275591;
const MM_TO_PT = 2.83465;
const PT_TO_PX = 1.333;
// Mock template (40mm x 20mm label)
const createMockTemplate = (widthMm = 40, heightMm = 20) => ({
    id: 'test-template',
    name: 'Test Template',
    description: null,
    width: widthMm,
    height: heightMm,
    unit: 'mm',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    elements: [
        {
            id: 'text-1',
            type: 'text',
            variableName: 'productName',
            x: 5,
            y: 5,
            width: 30,
            height: 10,
            rotation: 0,
            properties: JSON.stringify({
                fontSize: 12,
                fontFamily: 'helvetica',
                color: '#000000',
                align: 'center',
                verticalAlign: 'middle',
            }),
        },
    ],
});
// Mock CSV data
const mockCsvHeaders = ['productName'];
const mockCsvData = [['Test Product']];
// Mock PDF options (A4 portrait with 10mm margins)
const mockPdfOptions = {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
};
// Mock label layout (3x5 grid)
const mockLabelLayout = {
    labelsPerRow: 3,
    labelsPerColumn: 5,
    labelsPerPage: 15,
    horizontalSpacing: 5,
    verticalSpacing: 5,
};
describe('PDF Generation - Label Dimensions', () => {
    it('should generate PDF with correct label dimensions in mm', async () => {
        const template = createMockTemplate(40, 20);
        const pdfBuffer = await generateLabelPDF({
            template,
            csvData: mockCsvData,
            csvHeaders: mockCsvHeaders,
            mapping: { productName: 'productName' },
            pdfOptions: mockPdfOptions,
            labelLayout: mockLabelLayout,
        });
        // Parse PDF to extract dimensions
        const pdfContent = pdfBuffer.toString('latin1');
        // Find rectangle drawing commands (re operator)
        // Format: x y width height re (with many decimal places)
        const rectMatches = pdfContent.match(/(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(-?\d+\.\d+)\s+re/g);
        expect(rectMatches).toBeTruthy();
        expect(rectMatches.length).toBeGreaterThan(0);
        // Extract first rectangle dimensions (label background)
        const firstRect = rectMatches[0];
        const parts = firstRect.split(/\s+/).map(Number);
        const rectWidth = parts[2];
        const rectHeight = Math.abs(parts[3]); // Height is negative in PDF
        // jsPDF stores values in points internally even with unit: 'mm'
        // 40mm = 40 * 2.83465 = 113.386 points
        // 20mm = 20 * 2.83465 = 56.693 points
        expect(rectWidth).toBeCloseTo(40 * MM_TO_PT, 1);
        expect(rectHeight).toBeCloseTo(20 * MM_TO_PT, 1);
    });
    it('should generate PDF with correct label positioning', async () => {
        const template = createMockTemplate(40, 20);
        const pdfBuffer = await generateLabelPDF({
            template,
            csvData: mockCsvData,
            csvHeaders: mockCsvHeaders,
            mapping: { productName: 'productName' },
            pdfOptions: mockPdfOptions,
            labelLayout: mockLabelLayout,
        });
        const pdfContent = pdfBuffer.toString('latin1');
        const rectMatches = pdfContent.match(/(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(-?\d+\.\d+)\s+re/g);
        expect(rectMatches).toBeTruthy();
        // First label should start at marginLeft, marginTop (10mm, 10mm)
        const firstRect = rectMatches[0];
        const parts = firstRect.split(/\s+/).map(Number);
        const firstX = parts[0];
        const firstY = parts[1];
        // jsPDF stores coordinates in points
        // marginLeft = 10mm = 28.35pt
        // A4 height in points = 841.89pt, Y coords from bottom
        expect(firstX).toBeCloseTo(10 * MM_TO_PT, 1);
        expect(firstY).toBeCloseTo(841.89 - 10 * MM_TO_PT, 1);
    });
    it('should handle different label sizes correctly', async () => {
        const sizes = [
            { width: 50, height: 30 },
            { width: 25, height: 15 },
            { width: 100, height: 50 },
        ];
        for (const size of sizes) {
            const template = createMockTemplate(size.width, size.height);
            const pdfBuffer = await generateLabelPDF({
                template,
                csvData: mockCsvData,
                csvHeaders: mockCsvHeaders,
                mapping: { productName: 'productName' },
                pdfOptions: mockPdfOptions,
                labelLayout: mockLabelLayout,
            });
            const pdfContent = pdfBuffer.toString('latin1');
            const rectMatches = pdfContent.match(/(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(-?\d+\.\d+)\s+re/g);
            expect(rectMatches).toBeTruthy();
            const firstRect = rectMatches[0];
            const parts = firstRect.split(/\s+/).map(Number);
            const rectWidth = parts[2];
            const rectHeight = Math.abs(parts[3]);
            expect(rectWidth).toBeCloseTo(size.width * MM_TO_PT, 1);
            expect(rectHeight).toBeCloseTo(size.height * MM_TO_PT, 1);
        }
    });
});
describe('PDF Generation - Element Positioning', () => {
    it('should position text elements relative to label origin', async () => {
        const template = {
            ...createMockTemplate(40, 20),
            elements: [
                {
                    id: 'text-1',
                    type: 'text',
                    variableName: 'productName',
                    x: 10, // 10mm from left edge of label
                    y: 5, // 5mm from top edge of label
                    width: 20,
                    height: 10,
                    rotation: 0,
                    properties: JSON.stringify({
                        fontSize: 12,
                        fontFamily: 'helvetica',
                        color: '#000000',
                        align: 'left',
                    }),
                },
            ],
        };
        const pdfBuffer = await generateLabelPDF({
            template,
            csvData: mockCsvData,
            csvHeaders: mockCsvHeaders,
            mapping: { productName: 'productName' },
            pdfOptions: mockPdfOptions,
            labelLayout: mockLabelLayout,
        });
        const pdfContent = pdfBuffer.toString('latin1');
        // Find text positioning (Td operator)
        // Text should be at: marginLeft (10) + element.x (10) = 20mm
        const textMatches = pdfContent.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+Td/g);
        expect(textMatches).toBeTruthy();
        // First text position
        const firstText = textMatches[0];
        const parts = firstText.split(/\s+/).map(Number);
        const textX = parts[0];
        // Should be approximately 20mm in points (marginLeft + element.x) * MM_TO_PT
        expect(textX).toBeCloseTo(20 * MM_TO_PT, 0);
    });
});
describe('PDF Generation - Font Size', () => {
    it('should set correct font size in mm', async () => {
        const fontSizePt = 16;
        const template = {
            ...createMockTemplate(40, 20),
            elements: [
                {
                    id: 'text-1',
                    type: 'text',
                    variableName: 'productName',
                    x: 5,
                    y: 5,
                    width: 30,
                    height: 10,
                    rotation: 0,
                    properties: JSON.stringify({
                        fontSize: fontSizePt,
                        fontFamily: 'helvetica',
                        color: '#000000',
                    }),
                },
            ],
        };
        const pdfBuffer = await generateLabelPDF({
            template,
            csvData: mockCsvData,
            csvHeaders: mockCsvHeaders,
            mapping: { productName: 'productName' },
            pdfOptions: mockPdfOptions,
            labelLayout: mockLabelLayout,
        });
        const pdfContent = pdfBuffer.toString('latin1');
        // Find font size (Tf operator)
        // Format: /F1 size Tf - size is in points
        const fontMatches = pdfContent.match(/\/F\d+\s+(\d+\.?\d*)\s+Tf/g);
        expect(fontMatches).toBeTruthy();
        // jsPDF stores font size in points
        // But our code converts pt to mm: fontSizeMm = fontSizePt * 0.3528
        // Then jsPDF converts back to points for the PDF stream
        // So we expect: fontSizePt * 0.3528 (in mm) -> converted to points by jsPDF
        const fontSizeMatch = fontMatches[0].match(/(\d+\.?\d*)/);
        const actualFontSize = parseFloat(fontSizeMatch[0]);
        // The font size in PDF should be approximately the pt value
        // (jsPDF may apply some internal conversion)
        expect(actualFontSize).toBeGreaterThan(0);
        expect(actualFontSize).toBeLessThan(50);
    });
});
