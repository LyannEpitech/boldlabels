import type { Template, PDFOptions, LabelLayout } from '../types';
import { LabelPreview } from './LabelPreview';

interface PagePreviewProps {
  template: Template;
  csvData: string[][];
  csvHeaders: string[];
  mapping: Record<string, string>;
  pdfOptions: PDFOptions;
  labelLayout: LabelLayout;
  currentRowIndex?: number;
}

export function PagePreview({
  template,
  csvData,
  csvHeaders,
  mapping,
  pdfOptions,
  labelLayout,
  currentRowIndex = 0,
}: PagePreviewProps) {
  // Calculate page dimensions in mm
  const pageWidth = pdfOptions.orientation === 'portrait' ? 210 : 297;
  const pageHeight = pdfOptions.orientation === 'portrait' ? 297 : 210;

  // Get the data rows to display (up to labelsPerPage)
  const rowsToShow = csvData.slice(
    currentRowIndex,
    currentRowIndex + labelLayout.labelsPerPage
  );

  // Fill with empty rows if needed to show full layout
  const displayRows = [...rowsToShow];
  while (displayRows.length < labelLayout.labelsPerPage) {
    displayRows.push([]);
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg overflow-auto">
      <div className="text-sm text-gray-600 mb-2">
        Aperçu de la page ({labelLayout.labelsPerRow} × {labelLayout.labelsPerColumn} = {labelLayout.labelsPerPage} étiquettes)
      </div>
      
      <div
        className="bg-white shadow-lg mx-auto relative"
        style={{
          width: `${pageWidth * 2}px`,
          height: `${pageHeight * 2}px`,
          padding: `${pdfOptions.margins.top * 2}px ${pdfOptions.margins.right * 2}px ${pdfOptions.margins.bottom * 2}px ${pdfOptions.margins.left * 2}px`,
        }}
      >
        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: `repeat(${labelLayout.labelsPerRow}, ${template.width * 2}px)`,
            gridTemplateRows: `repeat(${labelLayout.labelsPerColumn}, ${template.height * 2}px)`,
            columnGap: `${labelLayout.horizontalSpacing * 2}px`,
            rowGap: `${labelLayout.verticalSpacing * 2}px`,
          }}
        >
          {displayRows.map((row, index) => (
            <div
              key={index}
              className="border border-dashed border-gray-300 bg-white relative overflow-hidden"
              style={{
                width: `${template.width * 2}px`,
                height: `${template.height * 2}px`,
              }}
            >
              {row.length > 0 ? (
                <LabelPreview
                  template={template}
                  rowData={row}
                  csvHeaders={csvHeaders}
                  mapping={mapping}
                  scale={0.5}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
                  Vide
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-2 text-center">
        Dimensions: {pageWidth}mm × {pageHeight}mm | 
        Étiquette: {template.width}mm × {template.height}mm
      </div>
    </div>
  );
}
