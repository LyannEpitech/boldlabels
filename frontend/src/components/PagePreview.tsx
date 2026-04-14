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

  // Calculate actual number of labels to show based on current layout settings
  const actualLabelsPerPage = labelLayout.labelsPerRow * labelLayout.labelsPerColumn;
  
  // Fill with empty rows if needed to show full layout
  const displayRows = [...rowsToShow];
  while (displayRows.length < actualLabelsPerPage) {
    displayRows.push([]);
  }

  // Group rows by line
  const rows: string[][][] = [];
  for (let i = 0; i < actualLabelsPerPage; i += labelLayout.labelsPerRow) {
    rows.push(displayRows.slice(i, i + labelLayout.labelsPerRow));
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${labelLayout.verticalSpacing * 2}px` }}>
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{ display: 'flex', gap: `${labelLayout.horizontalSpacing * 2}px` }}
            >
              {row.map((data, colIndex) => (
                <div
                  key={colIndex}
                  className={`bg-white relative overflow-hidden flex-shrink-0 ${
                    labelLayout.horizontalSpacing === 0 && labelLayout.verticalSpacing === 0
                      ? ''
                      : 'border border-dashed border-gray-300'
                  }`}
                  style={{
                    width: `${template.width * 2}px`,
                    height: `${template.height * 2}px`,
                  }}
                >
                  {data.length > 0 ? (
                    <LabelPreview
                      template={template}
                      rowData={data}
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
