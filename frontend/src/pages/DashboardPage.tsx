import { Link } from 'react-router-dom';
import { useEditorStore } from '../stores/editorStore';
import { useMappingStore } from '../stores/mappingStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useState } from 'react';
import { Plus, Copy, Trash2, Edit3, FileText, Download, Settings } from 'lucide-react';

const PRESETS = [
  { name: 'Avery 5160', width: 63.5, height: 25.4 },
  { name: 'Avery 5163', width: 101.6, height: 50.8 },
  { name: 'Avery 5164', width: 101.6, height: 139.7 },
  { name: 'Avery 5167', width: 38.1, height: 21.2 },
];

export function DashboardPage() {
  const { templates, createTemplate, deleteTemplate, duplicateTemplate, loadTemplate } = useEditorStore();
  const { mappings, deleteMapping } = useMappingStore();
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

  const getTemplateName = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    return template?.name || 'Template inconnu';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏷️ BoldLabels</h1>
            <p className="text-gray-600 mt-1">Gérez vos templates et mappings</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus size={18} />}>
            Nouveau template
          </Button>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Templates */}
          <div className="col-span-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={20} />
              Templates
            </h2>
            
            {templates.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow">
                <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">Aucun template</p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {template.width}×{template.height}mm • {template.elements.length} éléments
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex gap-1 pt-2">
                      <Link to={`/editor/${template.id}`} className="flex-1">
                        <Button variant="primary" size="sm" className="w-full" leftIcon={<Edit3 size={14} />} onClick={() => handleEdit(template.id)}>
                          Éditer
                        </Button>
                      </Link>
                      <Link to={`/mapping/${template.id}`}>
                        <Button variant="secondary" size="sm" leftIcon={<Settings size={14} />}>
                          Mapper
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" leftIcon={<Copy size={14} />} onClick={() => duplicateTemplate(template.id)} />
                      <Button variant="ghost" size="sm" className="text-red-500" leftIcon={<Trash2 size={14} />} onClick={() => {
                        if (confirm('Supprimer ce template ?')) deleteTemplate(template.id);
                      }} />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Mappings */}
          <div className="col-span-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Settings size={20} />
              Mes Mappings
            </h2>
            
            {mappings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Settings size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun mapping</h3>
                <p className="text-gray-500 mb-4">Créez un mapping depuis un template pour générer des PDF rapidement</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mappings.map((mapping) => (
                  <Card key={mapping.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{mapping.name}</CardTitle>
                      <CardDescription className="text-xs">
                        Template: {getTemplateName(mapping.templateId)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-gray-600">
                        {mapping.columnMappings.length} variables mappées
                      </p>
                    </CardContent>
                    <CardFooter className="flex gap-2 pt-2">
                      <Link to={`/generate/${mapping.templateId}?mapping=${mapping.id}`} className="flex-1">
                        <Button variant="primary" size="sm" className="w-full" leftIcon={<Download size={14} />}>
                          Générer PDF
                        </Button>
                      </Link>
                      <Link to={`/mapping/${mapping.templateId}`}>
                        <Button variant="secondary" size="sm" leftIcon={<Settings size={14} />}>
                          Modifier
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-red-500" leftIcon={<Trash2 size={14} />} onClick={() => {
                        if (confirm('Supprimer ce mapping ?')) deleteMapping(mapping.id);
                      }} />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Template Modal */}
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
