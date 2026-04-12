import { useState } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { ChevronRight, ChevronDown, Plus, Trash2, Settings, Copy } from 'lucide-react';

const PRESETS = [
  { id: 'avery-5160', name: 'Avery 5160', width: 63.5, height: 29.6 },
  { id: 'avery-5163', name: 'Avery 5163', width: 101.6, height: 50.8 },
  { id: 'square-50', name: 'Carré 50mm', width: 50, height: 50 },
];

export function Sidebar() {
  const { templates, template, createTemplate, loadTemplate, deleteTemplate, duplicateTemplate, updateTemplate } = useEditorStore();
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('avery-5160');
  const [expandedSection, setExpandedSection] = useState<string | null>('templates');
  
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    const preset = PRESETS.find((p) => p.id === selectedPreset);
    createTemplate({
      name: newName,
      width: preset?.width || 63.5,
      height: preset?.height || 29.6,
      unit: 'mm',
      backgroundColor: '#FFFFFF',
      borderWidth: 0,
      borderColor: '#000000',
      borderRadius: 0,
      elements: [],
    });
    setNewName('');
    setShowNewForm(false);
  };
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  return (
    <div className="w-64 bg-white border-r flex flex-col h-full">
      {/* Templates Section */}
      <div className="border-b">
        <button
          onClick={() => toggleSection('templates')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
        >
          <span className="font-medium text-sm">Templates</span>
          {expandedSection === 'templates' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        {expandedSection === 'templates' && (
          <div className="px-4 pb-4 space-y-2">
            {templates.length === 0 && <p className="text-xs text-gray-400 italic">Aucun template</p>}
            
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => loadTemplate(t.id)}
                className={`p-2 rounded cursor-pointer text-sm flex items-center justify-between ${
                  template?.id === t.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                }`}
              >
                <span className="truncate">{t.name}</span>
                <div className="flex gap-1">
                  {template?.id === t.id && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateTemplate(t.id);
                        }}
                        className="text-gray-500 hover:text-blue-600 p-1"
                        title="Dupliquer"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Supprimer ce template ?')) deleteTemplate(t.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {!showNewForm ? (
              <button
                onClick={() => setShowNewForm(true)}
                className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-dashed border-blue-300 flex items-center justify-center gap-1"
              >
                <Plus size={14} />
                Nouveau
              </button>
            ) : (
              <form onSubmit={handleCreate} className="space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nom du template"
                  className="w-full px-2 py-1 text-sm border rounded"
                  autoFocus
                />
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  {PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <button type="submit" className="flex-1 py-1 bg-blue-600 text-white rounded text-sm">
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="flex-1 py-1 bg-gray-200 rounded text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
      
      {/* Template Settings */}
      {template && (
        <div className="border-b">
          <button
            onClick={() => toggleSection('settings')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="font-medium text-sm flex items-center gap-2">
              <Settings size={14} />
              Paramètres
            </span>
            {expandedSection === 'settings' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {expandedSection === 'settings' && (
            <div className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Largeur (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={template.width}
                    onChange={(e) => updateTemplate({ width: parseFloat(e.target.value) || 1 })}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Hauteur (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={template.height}
                    onChange={(e) => updateTemplate({ height: parseFloat(e.target.value) || 1 })}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500">Couleur fond</label>
                <input
                  type="color"
                  value={template.backgroundColor}
                  onChange={(e) => updateTemplate({ backgroundColor: e.target.value })}
                  className="w-full h-8"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-500">Bordure (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={template.borderWidth}
                  onChange={(e) => updateTemplate({ borderWidth: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-500">Couleur bordure</label>
                <input
                  type="color"
                  value={template.borderColor}
                  onChange={(e) => updateTemplate({ borderColor: e.target.value })}
                  className="w-full h-8"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
