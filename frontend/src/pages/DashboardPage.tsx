import { Link } from 'react-router-dom';
import { useEditorStore } from '../stores/editorStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useState } from 'react';
import { Plus, Copy, Trash2, Edit3, FileText } from 'lucide-react';

const PRESETS = [
  { name: 'Avery 5160', width: 63.5, height: 25.4 },
  { name: 'Avery 5163', width: 101.6, height: 50.8 },
  { name: 'Avery 5164', width: 101.6, height: 139.7 },
  { name: 'Avery 5167', width: 38.1, height: 21.2 },
];

export function DashboardPage() {
  const { templates, createTemplate, deleteTemplate, duplicateTemplate, loadTemplate } = useEditorStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customWidth, setCustomWidth] = useState(50);
  const [customHeight, setCustomHeight] = useState(25);

  const handleCreate = () => {
    const preset = PRESETS.find((p) => p.name === selectedPreset);
    const width = preset ? preset.width : customWidth;
    const height = preset ? preset.height : customHeight;

    createTemplate({
      name: newTemplateName || 'Nouveau template',
      description: '',
      width,
      height,
      unit: 'mm',
      backgroundColor: '#FFFFFF',
      borderWidth: 0,
      borderColor: '#000000',
      borderRadius: 0,
      elements: [],
    });

    setIsCreateModalOpen(false);
    setNewTemplateName('');
    setSelectedPreset(null);
  };

  const handleEdit = (id: string) => {
    loadTemplate(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏷️ BoldLabels</h1>
            <p className="text-gray-600 mt-1">Gérez vos templates d'étiquettes</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus size={18} />}>
            Nouveau template
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun template</h3>
            <p className="text-gray-500 mb-4">Créez votre premier template pour commencer</p>
            <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus size={18} />}>
              Créer un template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>
                    {template.width}×{template.height}mm • {template.elements.length} éléments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded p-4 flex items-center justify-center" style={{ aspectRatio: template.width / template.height }}>
                    <div className="text-gray-400 text-sm">Aperçu</div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link to={`/editor/${template.id}`} className="flex-1">
                    <Button variant="primary" className="w-full" leftIcon={<Edit3 size={16} />} onClick={() => handleEdit(template.id)}>
                      Éditer
                    </Button>
                  </Link>
                  <Button variant="secondary" leftIcon={<Copy size={16} />} onClick={() => duplicateTemplate(template.id)} />
                  <Button variant="danger" leftIcon={<Trash2 size={16} />} onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
                      deleteTemplate(template.id);
                    }
                  }} />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nouveau template">
        <div className="space-y-4">
          <Input
            label="Nom du template"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="Mon template"
          />

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Format prédéfini</label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedPreset(preset.name)}
                  className={`p-3 rounded border text-left ${
                    selectedPreset === preset.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-gray-500">
                    {preset.width}×{preset.height}mm
                  </div>
                </button>
              ))}
            </div>
          </div>

          {!selectedPreset && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Largeur (mm)"
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(parseFloat(e.target.value) || 0)}
              />
              <Input
                label="Hauteur (mm)"
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleCreate}>
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
