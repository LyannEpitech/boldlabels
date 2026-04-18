import { useRef, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type { Template, PDFOptions, LabelLayout } from '../types';
import { LabelPreview } from './LabelPreview';
import { generatePDFFromImages, downloadPDF } from '../services/pdfExport';

const MM_TO_PX = 3.7795275591;

interface PDFExporterProps {
  template: Template;
  csvData: string[][];
  csvHeaders: string[];
  mapping: Record<string, string>;
  pdfOptions: PDFOptions;
  labelLayout: LabelLayout;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Hidden component that renders labels in offscreen Konva stages
 * and exports them as a PDF - pixel perfect WYSIWYG
 */
export function PDFExporter({
  template,
  csvData,
  csvHeaders,
  mapping,
  pdfOptions,
  labelLayout,
  onProgress,
}: PDFExporterProps) {
  const stageRefs = useRef<any[]>([]);

  const handleExport = useCallback(async () => {
    const totalLabels = csvData.length;

    onProgress?.(0, totalLabels);

    // Wait for all stages to render
    await new Promise(resolve => setTimeout(resolve, 500));

    const labelImages: { dataUrl: string; width: number; height: number }[] = [];

    for (let i = 0; i < stageRefs.current.length; i++) {
      const stage = stageRefs.current[i];
      if (!stage) continue;

      const dataUrl = stage.toDataURL({
        pixelRatio: 300 / 96, // 300 DPI quality
        mimeType: 'image/png',
      });

      labelImages.push({
        dataUrl,
        width: template.width,
        height: template.height,
      });

      onProgress?.(i + 1, totalLabels);
    }

    const doc = generatePDFFromImages(
      labelImages,
      template,
      pdfOptions,
      labelLayout,
    );

    downloadPDF(doc, `${template.name || 'labels'}.pdf`);
  }, [csvData, template, pdfOptions, labelLayout, mapping, onProgress]);

  // Render all labels in hidden stages
  const renderScale = 1; // Full scale for quality
  const stageWidth = template.width * MM_TO_PX;
  const stageHeight = template.height * MM_TO_PX;

  return (
    <div>
      {/* Hidden stages for rendering - positioned offscreen */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {csvData.map((rowData, index) => (
          <Stage
            key={index}
            ref={(el: any) => { stageRefs.current[index] = el; }}
            width={stageWidth}
            height={stageHeight}
          >
            <Layer>
              {/* Background */}
              <Rect
                x={0}
                y={0}
                width={stageWidth}
                height={stageHeight}
                fill={template.backgroundColor}
              />
              {/* Border */}
              {template.borderWidth > 0 && (
                <Rect
                  x={0}
                  y={0}
                  width={stageWidth}
                  height={stageHeight}
                  stroke={template.borderColor}
                  strokeWidth={template.borderWidth * MM_TO_PX}
                  cornerRadius={template.borderRadius || 0}
                />
              )}
              <LabelPreview
                template={template}
                rowData={rowData}
                csvHeaders={csvHeaders}
                mapping={mapping}
                scale={renderScale}
              />
            </Layer>
          </Stage>
        ))}
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Générer le PDF (WYSIWYG)
      </button>
    </div>
  );
}
