import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useEditorStore } from '../stores/editorStore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import Papa from 'papaparse';
import type { Mapping } from '../types';

export function MappingPage() {
  const { id } = useParams<{ id: string }>();
  const { template, templates, loadTemplate } = useEditorStore();
  
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvSample, setCsvSample] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, number>>({});
  const [mappingName, setMappingName] = useState('');
  const [savedMappings, setSavedMappings] = useState<Mapping[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  useEffect(() => {
    if (id && (!template || template.id !== id)) {
      loadTemplate(id);
    }
  }, [id, template, loadTemplate]);

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
          const firstRow = Object.values(results.data[0] as Record<string, string>);
          setCsvHeaders(headers);
          setCsvSample(firstRow);
          
          // Auto-map by name matching
          const autoMappings: Record<string, number> = {};
          template?.elements.forEach((el) => {
            const matchIndex = headers.findIndex(
              (h) => h.toLowerCase() === el.variableName.toLowerCase()
            );
            if (matchIndex !== -1) {
              autoMappings[el.variableName] = matchIndex;
            }
          });
          setMappings(autoMappings);
        }
      },
    });
  };

  const handleSaveMapping = () => {
    if (!template || !mappingName) return;
    
    const columnMappings = Object.entries(mappings).map(([variableName, columnIndex]) => ({
      variableName,
      columnIndex,
      columnName: csvHeaders[columnIndex],
    }));

    const newMapping: Mapping = {
      id: crypto.randomUUID(),
      name: mappingName,
      templateId: template.id,
      columnMappings,
      csvSample,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedMappings([...savedMappings, newMapping]);
    setIsSaveModalOpen(false);
    setMappingName('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={`/editor/${id}`}>
            <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mapping CSV</h1>
            <p className="text-gray-600">{template?.name}</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Importer un fichier CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Glissez-déposez ou cliquez pour sélectionner un fichier CSV</p>
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
          </CardContent>
        </Card>

        {csvHeaders.length > 0 && template && (
          <Card>
            <CardHeader>
              <CardTitle>Associer les colonnes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {template.elements.map((element) => (
                  <div key={element.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium">{element.variableName}</div>
                      <div className="text-sm text-gray-500">Type: {element.type}</div>
                    </div>
                    <div className="flex-1">
                      <select
                        value={mappings[element.variableName] ?? ''}
                        onChange={(e) =>
                          setMappings({
                            ...mappings,
                            [element.variableName]: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="">-- Non mappé --</option>
                        {csvHeaders.map((header, index) => (
                          <option key={header} value={index}>
                            {header} {csvSample[index] ? `(${csvSample[index]})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="primary"
                leftIcon={<Save size={16} />}
                onClick={() => setIsSaveModalOpen(true)}
                disabled={Object.keys(mappings).length === 0}
              >
                Sauvegarder le mapping
              </Button>
            </CardFooter>
          </Card>
        )}

        {savedMappings.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Mappings sauvegardés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {savedMappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">{mapping.name}</div>
                      <div className="text-sm text-gray-500">
                        {mapping.columnMappings.length} associations
                      </div>
                    </div>
                    <Link to={`/generate/${id}?mapping=${mapping.id}`}>
                      <Button variant="primary" size="sm">
                        Générer
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Sauvegarder le mapping"
      >
        <div className="space-y-4">
          <Input
            label="Nom du mapping"
            value={mappingName}
            onChange={(e) => setMappingName(e.target.value)}
            placeholder="Mon mapping"
          />
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setIsSaveModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSaveMapping} disabled={!mappingName}>
              Sauvegarder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
