// PDF Generation Constants
// Shared between pdfExport.ts and PDFExporter.tsx

export const PDF_CONSTANTS = {
  // DPI settings for print quality
  SCREEN_DPI: 96,
  PRINT_DPI: 300,
  
  // Pixel ratio for high-res exports
  // 300 DPI / 96 DPI ≈ 3.125x
  get PIXEL_RATIO() {
    return this.PRINT_DPI / this.SCREEN_DPI;
  },
  
  // MM to PX conversion
  MM_TO_PX: 3.7795275591,
} as const;
