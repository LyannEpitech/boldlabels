import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Navigate, Link } from 'react-router-dom';
import { useEditorStore } from '../stores/editorStore';
import { useMappingStore } from '../stores/mappingStore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EANDebugger } from '../components/EANDebugger';
import { ArrowLeft, Download, FileText, Upload } from 'lucide-react';
import { pdfService, dbService } from '../services/dbService';
import { PagePreview } from '../components/PagePreview';
import { LayoutPresetManager } from '../components/LayoutPresetManager';
import { validateAllEANs, type EANValidationResult } from '../utils/eanValidator';
import Papa from 'papaparse';
import type { PDFOptions, LabelLayout } from '../types';

export function GeneratePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mappingId = searchParams.get('mapping');
  const { template, templates, loadTemplate } = useEditorStore();
  const { mappings: savedMappings } = useMappingStore();

  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEANDebugger, setShowEANDebugger] = useState(false);
  const [eanResults, setEanResults] = useState<EANValidationResult[]>([]);

  const [pdfOptions, setPdfOptions] = useState<PDFOptions>({
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
  });

  const [labelLayout, setLabelLayout] = useState<LabelLayout>({
    labelsPerRow: 3,
    labelsPerColumn: 8,
    labelsPerPage: 24,
    horizontalSpacing: 2,
    verticalSpacing: 0,
  });

  useEffect(() => {
    if (id && (!template || template.id !== id)) {
      loadTemplate(id);
    }
  }, [id, template, loadTemplate]);

  // Load session data from API (replaces localStorage)
  useEffect(() => {
    if (!id) return;
    
    const loadSessionData = async () => {
      try {
        const sessionData = await dbService.getSessionData(id);
        
        if (sessionData) {
          // Load CSV data
          if (sessionData.csvHeaders && sessionData.csvRows) {
            setCsvHeaders(sessionData.csvHeaders);
            setCsvData(sessionData.csvRows);
          } else {
            setShowUploadModal(true);
          }
          
          // Load PDF options
          if (sessionData.pageSize) {
            setPdfOptions({
              pageSize: sessionData.pageSize,
              orientation: sessionData.orientation as 'portrait' | 'landscape',
              margins: {
                top: sessionData.marginTop,
                right: sessionData.marginRight,
                bottom: sessionData.marginBottom,
                left: sessionData.marginLeft,
              },
            });
          }
          
          // Load label layout
          if (sessionData.labelsPerRow) {
            setLabelLayout({
              labelsPerRow: sessionData.labelsPerRow,
              labelsPerColumn: sessionData.labelsPerColumn,
              labelsPerPage: sessionData.labelsPerRow * sessionData.labelsPerColumn,
              horizontalSpacing: sessionData.horizontalSpacing,
              verticalSpacing: sessionData.verticalSpacing,
            });
            setIsAutoCalculated(true);
          }
        } else {
          setShowUploadModal(true);
        }
      } catch (error) {
        console.error('Failed to load session data:', error);
        setShowUploadModal(true);
      }
    };
    
    loadSessionData();

    // Load mapping from Zustand store
    if (mappingId) {
      const foundMapping = savedMappings.find((m) => m.id === mappingId);
      if (foundMapping) {
        const mappingRecord: Record<string, string> = {};
        foundMapping.columnMappings.forEach((cm) => {
          mappingRecord[cm.variableName] = cm.columnName;
        });
        setMapping(mappingRecord);
        console.log('Loaded mapping from store:', mappingRecord);
      }
    }
  }, [id, mappingId, savedMappings]);

  // Auto-calculation flag
  const [isAutoCalculated, setIsAutoCalculated] = useState(false);

  // Save session data to API when settings change (debounced)
  useEffect(() => {
    if (!id) return;
    
    const timeout = setTimeout(() => {
      dbService.saveSessionData(id, {
        csvHeaders,
        csvRows: csvData,
        pageSize: pdfOptions.pageSize,
        orientation: pdfOptions.orientation,
        marginTop: pdfOptions.margins.top,
        marginRight: pdfOptions.margins.right,
        marginBottom: pdfOptions.margins.bottom,
        marginLeft: pdfOptions.margins.left,
        labelsPerRow: labelLayout.labelsPerRow,
        labelsPerColumn: labelLayout.labelsPerColumn,
        horizontalSpacing: labelLayout.horizontalSpacing,
        verticalSpacing: labelLayout.verticalSpacing,
        selectedMappingId: mappingId,
      }).catch(console.error);
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(timeout);
  }, [pdfOptions, labelLayout, id]);

  // Auto-calculate layout based on template size (only on initial load if no saved settings)
  
  useEffect(() => {
    if (!template || isAutoCalculated) return;

    const pageWidth = pdfOptions.orientation === 'portrait' ? 210 : 297;
    const pageHeight = pdfOptions.orientation === 'portrait' ? 297 : 210;
    const availableWidth = pageWidth - pdfOptions.margins.left - pdfOptions.margins.right;
    const availableHeight = pageHeight - pdfOptions.margins.top - pdfOptions.margins.bottom;

    const labelsPerRow = Math.floor(availableWidth / template.width);
    const labelsPerColumn = Math.floor(availableHeight / template.height);

    if (labelsPerRow > 0 && labelsPerColumn > 0) {
      setLabelLayout({
        labelsPerRow,
        labelsPerColumn,
        labelsPerPage: labelsPerRow * labelsPerColumn,
        horizontalSpacing: (availableWidth - labelsPerRow * template.width) / (labelsPerRow - 1 || 1),
        verticalSpacing: (availableHeight - labelsPerColumn * template.height) / (labelsPerColumn - 1 || 1),
      });
      setIsAutoCalculated(true);
    }
  }, [template, pdfOptions, isAutoCalculated]);

  if (!id) return <Navigate to="/" />;

  const exists = templates.some((t) => t.id === id);
  if (!exists) return <Navigate to="/" />;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const headers = Object.keys(results.data[0] as Record<string, string>);
          const rows = results.data.map((row: any) => headers.map((h) => row[h] || ''));

          setCsvHeaders(headers);
          setCsvData(rows);
          setShowUploadModal(false);
          
          // Session data will be saved by the useEffect
        }
      },
    });
  };

  const exportMode = 'wysiwyg' as const;

  const generatePDF = async () => {
    if (!template || csvData.length === 0) return;

    setIsGenerating(true);

    try {
      if (exportMode === 'wysiwyg') {
        // WYSIWYG: export from frontend preview (pixel-perfect)
        const { generatePDFFromImages, downloadPDF } = await import('../services/pdfExport');
        const MM_TO_PX = 3.7795275591;
        
        // For each label, capture from PagePreview
        // Use html2canvas approach or Konva stage export
        const labelImages: { dataUrl: string; width: number; height: number }[] = [];
        
        // Create offscreen stages for each label
        for (const row of csvData) {
          // Create canvas element
          const canvas = document.createElement('canvas');
          const scale = 3; // 300 DPI-ish
          canvas.width = template.width * MM_TO_PX * scale;
          canvas.height = template.height * MM_TO_PX * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          
          // Scale for high DPI
          ctx.scale(scale, scale);
          
          // Draw background
          ctx.fillStyle = template.backgroundColor;
          ctx.fillRect(0, 0, template.width * MM_TO_PX, template.height * MM_TO_PX);
          
          // Draw border
          if (template.borderWidth > 0) {
            ctx.strokeStyle = template.borderColor;
            ctx.lineWidth = template.borderWidth * MM_TO_PX;
            ctx.strokeRect(0, 0, template.width * MM_TO_PX, template.height * MM_TO_PX);
          }
          
          // Draw elements
          const sortedElements = [...template.elements].sort((a, b) => a.zIndex - b.zIndex);
          for (const element of sortedElements) {
            const props = JSON.parse(element.properties as string || '{}');
            const value = (() => {
              const colName = mapping[element.variableName];
              if (!colName) return `[${element.variableName}]`;
              const colIndex = csvHeaders.indexOf(colName);
              if (colIndex === -1 || !row[colIndex]) return `[${element.variableName}]`;
              return row[colIndex];
            })();
            
            const ex = element.x * MM_TO_PX;
            const ey = element.y * MM_TO_PX;
            const ew = element.width * MM_TO_PX;
            const eh = element.height * MM_TO_PX;
            
            if (element.type === 'text') {
              ctx.fillStyle = props.color || '#000000';
              const fontStyle = props.fontWeight === 'bold' ? 'bold ' : '';
              ctx.font = `${fontStyle}${(props.fontSize || 12) * MM_TO_PX / 2.5}px ${props.fontFamily || 'Arial'}`;
              ctx.textAlign = (props.align || 'left') as CanvasTextAlign;
              ctx.textBaseline = 'middle';
              
              const textX = props.align === 'center' ? ex + ew / 2 : 
                            props.align === 'right' ? ex + ew : ex;
              ctx.fillText(value + (props.suffix || ''), textX, ey + eh / 2, ew);
            } else if (element.type === 'barcode') {
              // Draw barcode placeholder
              ctx.fillStyle = '#000';
              const barWidth = 1.5;
              const totalBars = Math.floor(ew / (barWidth * 2));
              for (let i = 0; i < totalBars; i++) {
                if (i % 3 !== 2) { // Skip every 3rd bar for visual effect
                  ctx.fillRect(ex + i * barWidth * 2, ey, barWidth, eh * 0.7);
                }
              }
              // Draw text below
              ctx.fillStyle = '#000';
              ctx.font = `8px monospace`;
              ctx.textAlign = 'center';
              ctx.fillText(value, ex + ew / 2, ey + eh * 0.85);
            } else if (element.type === 'qrcode') {
              // Draw QR placeholder
              const qrSize = Math.min(ew, eh);
              const cellSize = qrSize / 15;
              for (let r = 0; r < 15; r++) {
                for (let c = 0; c < 15; c++) {
                  if ((r + c) % 3 === 0 || (r < 5 && c < 5) || (r < 5 && c > 9)) {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(ex + c * cellSize, ey + r * cellSize, cellSize, cellSize);
                  }
                }
              }
            }
          }
          
          labelImages.push({
            dataUrl: canvas.toDataURL('image/png'),
            width: template.width,
            height: template.height,
          });
        }
        
        const doc = generatePDFFromImages(labelImages, template, pdfOptions, labelLayout);
        downloadPDF(doc, `${template.name || 'labels'}.pdf`);
      } else {
        // Backend generation (original)
        await pdfService.generateAndSavePDF(
          template,
          csvData,
          csvHeaders,
          mapping,
          pdfOptions,
          labelLayout
        );
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Erreur lors de la génération du PDF');
    }

    setIsGenerating(false);
  };

  const handleGeneratePDF = async () => {
    if (!template || csvData.length === 0) return;

    // Valider tous les codes EAN
    const results = validateAllEANs(csvData, csvHeaders, template, mapping);
    setEanResults(results);

    const hasErrors = results.some(r => !r.valid);
    if (hasErrors) {
      setShowEANDebugger(true);
      return;
    }

    // Si tout est valide, générer directement
    await generatePDF();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={`/mapping/${id}`}>
            <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Générer les étiquettes</h1>
            <p className="text-gray-600">{template?.name}</p>
          </div>
        </div>

        {csvData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Upload size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée CSV</h3>
              <p className="text-gray-500 mb-4">Importez un fichier CSV pour générer les étiquettes</p>
              <Button onClick={() => setShowUploadModal(true)} leftIcon={<Upload size={16} />}>
                Importer CSV
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Options Panel */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Options de mise en page</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Format de page</label>
                        <select
                          value={pdfOptions.pageSize}
                          onChange={(e) => setPdfOptions({ ...pdfOptions, pageSize: e.target.value as any })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        >
                          <option value="A4">A4</option>
                          <option value="A5">A5</option>
                          <option value="Letter">Letter</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Orientation</label>
                        <select
                          value={pdfOptions.orientation}
                          onChange={(e) => setPdfOptions({ ...pdfOptions, orientation: e.target.value as any })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        >
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Paysage</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Marges (mm)</label>
                      <div className="grid grid-cols-4 gap-2 mt-1">
                        <Input
                          label="Haut"
                          type="number"
                          value={pdfOptions.margins.top}
                          onChange={(e) => setPdfOptions({
                            ...pdfOptions,
                            margins: { ...pdfOptions.margins, top: parseFloat(e.target.value) || 0 }
                          })}
                        />
                        <Input
                          label="Droite"
                          type="number"
                          value={pdfOptions.margins.right}
                          onChange={(e) => setPdfOptions({
                            ...pdfOptions,
                            margins: { ...pdfOptions.margins, right: parseFloat(e.target.value) || 0 }
                          })}
                        />
                        <Input
                          label="Bas"
                          type="number"
                          value={pdfOptions.margins.bottom}
                          onChange={(e) => setPdfOptions({
                            ...pdfOptions,
                            margins: { ...pdfOptions.margins, bottom: parseFloat(e.target.value) || 0 }
                          })}
                        />
                        <Input
                          label="Gauche"
                          type="number"
                          value={pdfOptions.margins.left}
                          onChange={(e) => setPdfOptions({
                            ...pdfOptions,
                            margins: { ...pdfOptions.margins, left: parseFloat(e.target.value) || 0 }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Presets</CardTitle>
                </CardHeader>
                <CardContent>
                  {id && (
                    <LayoutPresetManager
                      templateId={id}
                      pdfOptions={pdfOptions}
                      labelLayout={labelLayout}
                      onLoadPreset={(newPdfOptions, newLabelLayout) => {
                        setPdfOptions(newPdfOptions);
                        setLabelLayout(newLabelLayout);
                        setIsAutoCalculated(true);
                      }}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Disposition des étiquettes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <button
                      onClick={() => setIsAutoCalculated(false)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Calculer automatiquement selon la taille de l'étiquette
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Étiquettes par ligne"
                      type="number"
                      value={labelLayout.labelsPerRow}
                      onChange={(e) => {
                        const labelsPerRow = parseInt(e.target.value) || 1;
                        setLabelLayout({ 
                          ...labelLayout, 
                          labelsPerRow,
                          labelsPerPage: labelsPerRow * labelLayout.labelsPerColumn
                        });
                      }}
                    />
                    <Input
                      label="Étiquettes par colonne"
                      type="number"
                      value={labelLayout.labelsPerColumn}
                      onChange={(e) => {
                        const labelsPerColumn = parseInt(e.target.value) || 1;
                        setLabelLayout({ 
                          ...labelLayout, 
                          labelsPerColumn,
                          labelsPerPage: labelLayout.labelsPerRow * labelsPerColumn
                        });
                      }}
                    />
                    <Input
                      label="Espacement horizontal (mm)"
                      type="number"
                      step="0.1"
                      value={Math.round(labelLayout.horizontalSpacing * 10) / 10}
                      onChange={(e) => setLabelLayout({ ...labelLayout, horizontalSpacing: parseFloat(e.target.value) || 0 })}
                    />
                    <Input
                      label="Espacement vertical (mm)"
                      type="number"
                      step="0.1"
                      value={Math.round(labelLayout.verticalSpacing * 10) / 10}
                      onChange={(e) => setLabelLayout({ ...labelLayout, verticalSpacing: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Données</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{csvData.length} lignes importées</p>
                      <p className="text-sm text-gray-500">{csvHeaders.length} colonnes</p>
                    </div>
                    <Button variant="secondary" onClick={() => setShowUploadModal(true)} leftIcon={<Upload size={16} />}>
                      Changer le fichier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview & Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aperçu de la page</CardTitle>
                </CardHeader>
                <CardContent>
                  {template && csvData.length > 0 ? (
                    <PagePreview
                      template={template}
                      csvData={csvData}
                      csvHeaders={csvHeaders}
                      mapping={mapping}
                      pdfOptions={pdfOptions}
                      labelLayout={labelLayout}
                    />
                  ) : (
                    <div
                      className="bg-gray-100 rounded p-4 border-2 border-dashed border-gray-300"
                      style={{
                        aspectRatio: pdfOptions.orientation === 'portrait' ? 210 / 297 : 297 / 210,
                      }}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center text-center">
                        <FileText size={32} className="text-gray-400 mb-2" />
                        <p className="text-sm font-medium">{csvData.length} étiquettes</p>
                        <p className="text-xs text-gray-500">
                          {labelLayout.labelsPerRow}×{labelLayout.labelsPerColumn} par page
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.ceil(csvData.length / labelLayout.labelsPerPage)} pages
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="primary"
                    className="w-full"
                    leftIcon={<Download size={16} />}
                    onClick={handleGeneratePDF}
                    isLoading={isGenerating}
                  >
                    {isGenerating ? 'Génération...' : 'Télécharger PDF'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showUploadModal}
        onClose={() => csvData.length > 0 && setShowUploadModal(false)}
        title="Importer un fichier CSV"
      >
        <div className="text-center py-8">
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Sélectionnez un fichier CSV contenant vos données</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <span className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Upload size={16} />
              Sélectionner un fichier
            </span>
          </label>
        </div>
      </Modal>

      <EANDebugger
        isOpen={showEANDebugger}
        onClose={() => setShowEANDebugger(false)}
        onContinue={() => {
          setShowEANDebugger(false);
          generatePDF();
        }}
        results={eanResults}
      />
    </div>
  );
}
