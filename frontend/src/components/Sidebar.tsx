import { useState } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { extendedPresets, categories } from '../data/extendedTemplates';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Search,
  Grid3X3,
  ShoppingBag,
  Truck,
  Utensils,
  Sparkles,
  Palette,
  X
} from 'lucide-react';
import type { Template } from '../types';

const iconMap = {
  Grid3X3,
  ShoppingBag,
  Truck,
  Utensils,
  Sparkles,
  Palette,
};

export function Sidebar() {
  const { 
    templates, 
    template, 
    createTemplate, 
    loadTemplate, 
    deleteTemplate, 
    duplicateTemplate, 
    updateTemplate 
  } = useEditorStore();
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my-templates' | 'presets'>('my-templates');

  const filteredPresets = extendedPresets.filter((preset) => {
    const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;
    const matchesSearch = preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         preset.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateFromPreset = (presetTemplate: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => {
    createTemplate(presetTemplate);
    setActiveTab('my-templates');
  };

  const handleCreateBlank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    createTemplate({
      name: newName,
      width: 63.5,
      height: 29.6,
      unit: 'mm',
      backgroundColor: '#FFFFFF',
      borderWidth: 0,
      borderColor: '#000000',
      borderRadius: 0,
      description: '',
      elements: [],
    });
    setNewName('');
    setShowNewForm(false);
  };

  return (
    <div className="w-80 bg-surface-raised border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Grid3X3 className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-text-primary">BoldLabels</span>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 bg-surface-sunken rounded-lg p-1">
          <button
            onClick={() => setActiveTab('my-templates')}
            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
              activeTab === 'my-templates'
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Mes templates
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
              activeTab === 'presets'
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Presets
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'my-templates' ? (
          <div className="p-4 space-y-3">
            {/* New Template Button */}
            {!showNewForm ? (
              <Button
                variant="ghost"
                className="w-full border border-dashed border-border hover:border-brand-300"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowNewForm(true)}
              >
                Nouveau template
              </Button>
            ) : (
              <Card padding="sm" shadow="none">
                <form onSubmit={handleCreateBlank} className="space-y-3">
                  <Input
                    label="Nom du template"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Mon template"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="flex-1">
                      Créer
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowNewForm(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Templates List */}
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-muted text-sm">Aucun template</p>
                <p className="text-text-muted text-xs mt-1">Créez votre premier template</p>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => (
                  <Card
                    key={t.id}
                    padding="sm"
                    shadow="none"
                    hover
                    className={`cursor-pointer transition-all ${
                      template?.id === t.id 
                        ? 'ring-2 ring-brand-500 border-brand-300' 
                        : ''
                    }`}
                    onClick={() => loadTemplate(t.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-text-primary truncate">
                          {t.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {t.width}×{t.height} mm
                        </p>
                      </div>
                      {template?.id === t.id && (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateTemplate(t.id);
                            }}
                            className="p-1.5 text-text-muted hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                            title="Dupliquer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Supprimer ce template ?')) deleteTemplate(t.id);
                            }}
                            className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-light rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un preset..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-lg placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const Icon = iconMap[cat.icon as keyof typeof iconMap];
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-brand-500 text-white'
                        : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-3">
              {filteredPresets.map((preset) => (
                <Card
                  key={preset.id}
                  padding="none"
                  shadow="sm"
                  hover
                  className="cursor-pointer overflow-hidden group"
                  onClick={() => handleCreateFromPreset(preset.template as any)}
                >
                  {/* Preview Area */}
                  <div 
                    className="aspect-[4/3] bg-surface-sunken border-b border-border relative overflow-hidden"
                    style={{ backgroundColor: preset.template.backgroundColor }}
                  >
                    {preset.template.elements.length > 0 ? (
                      <div className="absolute inset-2 scale-[0.15] origin-top-left">
                        {preset.template.elements.map((el) => (
                          <div
                            key={el.id}
                            className="absolute border border-border bg-surface"
                            style={{
                              left: el.x,
                              top: el.y,
                              width: el.width,
                              height: el.height,
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Grid3X3 className="w-8 h-8 text-text-muted" />
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-brand-500 text-white rounded-full p-2">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-3">
                    <p className="font-medium text-sm text-text-primary truncate">
                      {preset.name}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                      {preset.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-text-muted">
                        {preset.template.width}×{preset.template.height}mm
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Template Settings (only when template selected) */}
      {template && activeTab === 'my-templates' && (
        <div className="border-t border-border p-4 space-y-4">
          <h3 className="font-medium text-sm text-text-primary">Paramètres</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Largeur (mm)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={template.width}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  updateTemplate({ width: isNaN(value) ? 1 : Math.max(1, value) });
                }}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Hauteur (mm)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={template.height}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  updateTemplate({ height: isNaN(value) ? 1 : Math.max(1, value) });
                }}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Couleur de fond</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={template.backgroundColor}
                onChange={(e) => updateTemplate({ backgroundColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-border"
              />
              <input
                type="text"
                value={template.backgroundColor}
                onChange={(e) => updateTemplate({ backgroundColor: e.target.value })}
                className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg font-mono uppercase"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
