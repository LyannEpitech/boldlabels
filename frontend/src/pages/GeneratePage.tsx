import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Navigate, Link } from 'react-router-dom';
import { useEditorStore } from '../stores/editorStore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, Download, FileText, Upload } from 'lucide-react';
import { generateLabelPDF } from '../utils/pdfGenerator';
import { LabelPreview } from '../components/LabelPreview';
import Papa from 'papaparse';
import type { PDFOptions, LabelLayout } from '../types';

export function GeneratePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mappingId = searchParams.get('mapping');
  const { template, templates, loadTemplate } = useEditorStore();

  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

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

  // Load saved data from localStorage
  useEffect(() => {
    const savedCsv = localStorage.getItem(`csv_${id}`);
    const savedMapping = localStorage.getItem(`mapping_${mappingId}`);

    if (savedCsv) {
      const parsed = JSON.parse(savedCsv);
      setCsvHeaders(parsed.headers);
      setCsvData(parsed.rows);
    } else {
      setShowUploadModal(true);
    }

    if (savedMapping) {
      const parsed = JSON.parse(savedMapping);
      // Store mapping by column name instead of index for flexibility
      const mappingRecord: Record<string, string> = {};
      parsed.columnMappings.forEach((cm: any) => {
        mappingRecord[cm.variableName] = cm.columnName; // Store column name, not index
      });
      setMapping(mappingRecord);
    }
  }, [id, mappingId]);

  // Auto-calculate layout based on template size
  useEffect(() => {
    if (!template) return;

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
    }
  }, [template, pdfOptions]);

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

          // Save to localStorage
          localStorage.setItem(`csv_${id}`, JSON.stringify({ headers, rows }));
          setShowUploadModal(false);
        }
      },
    });
  };

  const handleGeneratePDF = async () => {
    if (!template || csvData.length === 0) return;

    setIsGenerating(true);

    try {
      const doc = await generateLabelPDF({
        template,
        csvData,
        csvHeaders,
        mapping,
        pdfOptions,
        labelLayout,
      });

      doc.save(`${template.name}_labels.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Erreur lors de la génération du PDF');
    }

    setIsGenerating(false);
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
                  <CardTitle>Disposition des étiquettes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Étiquettes par ligne"
                      type="number"
                      value={labelLayout.labelsPerRow}
                      onChange={(e) => setLabelLayout({ ...labelLayout, labelsPerRow: parseInt(e.target.value) || 1 })}
                    />
                    <Input
                      label="Étiquettes par colonne"
                      type="number"
                      value={labelLayout.labelsPerColumn}
                      onChange={(e) => setLabelLayout({ ...labelLayout, labelsPerColumn: parseInt(e.target.value) || 1 })}
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
                  <CardTitle>Aperçu</CardTitle>
                </CardHeader>
                <CardContent>
                  {template && csvData.length > 0 ? (
                    <div className="bg-white rounded border overflow-hidden flex items-center justify-center p-4">
                      <LabelPreview
                        template={template}
                        rowData={csvData[0]}
                        csvHeaders={csvHeaders}
                        mapping={mapping}
                        scale={0.8}
                      />
                    </div>
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
    </div>
  );
}
