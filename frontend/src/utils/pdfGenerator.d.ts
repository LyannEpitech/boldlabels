import { jsPDF } from 'jspdf';
import type { Template, PDFOptions, LabelLayout } from '../types';
interface GeneratePDFOptions {
    template: Template;
    csvData: string[][];
    csvHeaders: string[];
    mapping: Record<string, string>;
    pdfOptions: PDFOptions;
    labelLayout: LabelLayout;
}
export declare function generateLabelPDF({ template, csvData, csvHeaders, mapping, pdfOptions, labelLayout, }: GeneratePDFOptions): Promise<jsPDF>;
export {};
//# sourceMappingURL=pdfGenerator.d.ts.map