import { useState } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { PropertiesPanel } from './canvas/PropertiesPanel';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { 
  Type, 
  Square, 
  QrCode, 
  Image as ImageIcon, 
  Trash2, 
  Undo2, 
  Redo2, 
  Grid3X3, 
  ZoomIn, 
  ZoomOut,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  MousePointer2,
  GripVertical
} from 'lucide-react';

const tools = [
  { type: 'text' as const, icon: Type, label: 'Texte', description: 'Texte dynamique' },
  { type: 'barcode' as const, icon: Square, label: 'Code-barres', description: 'EAN, UPC, Code 128' },
  { type: 'qrcode' as const, icon: QrCode, label: 'QR Code', description: 'QR Code scannable' },
  { type: 'image' as const, icon: ImageIcon, label: 'Image', description: 'Logo ou photo' },
  { type: 'rectangle' as const, icon: Square, label: 'Forme', description: 'Rectangle' },
];

// Tool Button Component
interface ToolButtonProps {
  tool: typeof tools[0];
  onClick: () => void;
}

const ToolButton = ({ tool, onClick }: ToolButtonProps) => {
  const Icon = tool.icon;
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('toolType', tool.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
      onClick={onClick}
      className={`group cursor-pointer transition-all ${isDragging ? 'opacity-50' : ''}`}
    >
      <Card 
        padding="sm" 
        shadow="sm" 
        hover 
        className="flex flex-col items-center gap-2 text-center"
      >
        <div className="w-10 h-10 bg-surface-sunken rounded-lg flex items-center justify-center group-hover:bg-brand-50 transition-colors">
          <Icon className="w-5 h-5 text-text-secondary group-hover:text-brand-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-text-primary">{tool.label}</p>
          <p className="text-[10px] text-text-muted">{tool.description}</p>
        </div>
      </Card>
    </div>
  );
};

// Layer Item Component
interface LayerItemProps {
  element: any;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  isLocked?: boolean;
  isVisible?: boolean;
}

const LayerItem = ({ 
  element, 
  isSelected, 
  onSelect, 
  onRemove,
  isLocked = false,
  isVisible = true
}: LayerItemProps) => {
  const [showActions, setShowActions] = useState(false);
  
  const getIcon = () => {
    switch (element.type) {
      case 'text': return <Type className="w-3.5 h-3.5" />;
      case 'barcode': return <Square className="w-3.5 h-3.5" />;
      case 'qrcode': return <QrCode className="w-3.5 h-3.5" />;
      case 'image': return <ImageIcon className="w-3.5 h-3.5" />;
      case 'rectangle': return <Square className="w-3.5 h-3.5" />;
      default: return <MousePointer2 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-all ${
        isSelected 
          ? 'bg-brand-50 ring-1 ring-brand-200' 
          : 'hover:bg-surface-sunken'
      }`}
    >
      <GripVertical className="w-3.5 h-3.5 text-text-muted cursor-grab opacity-0 group-hover:opacity-100" />
      
      <span className={`text-text-muted ${!isVisible ? 'opacity-50' : ''}`}>
        {getIcon()}
      </span>
      
      <span className={`flex-1 truncate ${isSelected ? 'text-brand-700 font-medium' : 'text-text-primary'}`}>
        {element.variableName}
      </span>
      
      <div className={`flex items-center gap-0.5 transition-opacity ${showActions || isSelected ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Toggle visibility
          }}
          className="p-1 text-text-muted hover:text-text-primary rounded"
          title={isVisible ? 'Masquer' : 'Afficher'}
        >
          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Toggle lock
          }}
          className="p-1 text-text-muted hover:text-text-primary rounded"
          title={isLocked ? 'Déverrouiller' : 'Verrouiller'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 text-text-muted hover:text-danger rounded"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export function Toolbar() {
  const {
    template,
    addElement,
    selectedElementId,
    selectElement,
    removeElement,
    zoom,
    setZoom,
    showGrid,
    setShowGrid,
    undo,
    redo,
    historyIndex,
    history,
  } = useEditorStore();
  
  const [activeTab, setActiveTab] = useState<'tools' | 'properties' | 'layers'>('tools');
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  const handleAddElement = (type: typeof tools[0]['type']) => {
    if (template && template.elements.length >= 50) {
      alert('Limite atteinte : maximum 50 éléments par template');
      return;
    }
    
    const defaults: Record<string, any> = {
      text: {
        properties: {
          fontFamily: 'Inter',
          fontSize: 14,
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#0F172A',
          align: 'left',
          verticalAlign: 'top',
          opacity: 1,
        },
      },
      barcode: {
        properties: {
          format: 'EAN13',
          displayValue: true,
          lineColor: '#0F172A',
          backgroundColor: '#FFFFFF',
        },
      },
      qrcode: {
        properties: {
          errorCorrectionLevel: 'M',
          foregroundColor: '#0F172A',
          backgroundColor: '#FFFFFF',
        },
      },
      image: {
        properties: {
          src: '',
          objectFit: 'contain',
        },
      },
      rectangle: {
        properties: {
          fillColor: 'transparent',
          borderColor: '#0F172A',
          borderWidth: 1,
          opacity: 1,
        },
      },
    };

    addElement({
      type,
      variableName: `${type}_${template?.elements.length || 0}`,
      x: 10,
      y: 10,
      width: type === 'qrcode' ? 20 : 40,
      height: type === 'qrcode' ? 20 : 15,
      rotation: 0,
      ...defaults[type],
    });
  };
  
  return (
    <div className="w-80 bg-surface border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-surface-raised">
        <h1 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand-500" />
          BoldLabels
        </h1>
        {template && (
          <p className="text-xs text-text-muted truncate mt-0.5">{template.name}</p>
        )}
      </div>
      
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-sunken">
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={!canRedo}
            title="Rétablir (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
            disabled={zoom <= 0.25}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs w-12 text-center font-medium text-text-primary">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            disabled={zoom >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          variant={showGrid ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          title="Grille"
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { id: 'tools', label: 'Outils' },
          { id: 'properties', label: 'Propriétés' },
          { id: 'layers', label: `Calques ${template ? `(${template.elements.length})` : ''}` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 text-xs font-medium transition-all relative ${
              activeTab === tab.id 
                ? 'text-brand-600' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />
            )}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {!template ? (
              <div className="text-center py-8">
                <Layers className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-sm text-text-muted">Créez un template pour commencer</p>
                <p className="text-xs text-text-muted mt-1">Utilisez la sidebar pour créer un template</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                    Glisser-déposer sur le canvas
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {tools.map((tool) => (
                      <ToolButton
                        key={tool.type}
                        tool={tool}
                        onClick={() => handleAddElement(tool.type)}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                    Raccourcis clavier
                  </h3>
                  <div className="space-y-2 text-xs text-text-muted">
                    <div className="flex justify-between">
                      <span>Ctrl + Click</span>
                      <span className="text-text-secondary">Multi-sélection</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ctrl + C / V</span>
                      <span className="text-text-secondary">Copier / Coller</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ctrl + D</span>
                      <span className="text-text-secondary">Dupliquer</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flèches</span>
                      <span className="text-text-secondary">Déplacer 1mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delete</span>
                      <span className="text-text-secondary">Supprimer</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Layers Tab */}
        {activeTab === 'layers' && (
          <div className="h-full overflow-y-auto p-3">
            {!template ? (
              <div className="text-center py-8">
                <Layers className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-sm text-text-muted">Aucun calque</p>
              </div>
            ) : template.elements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-text-muted">Aucun élément</p>
                <p className="text-xs text-text-muted mt-1">Ajoutez des éléments depuis l'onglet Outils</p>
              </div>
            ) : (
              <div className="space-y-1">
                {[...(template?.elements || [])]
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map((el) => (
                    <LayerItem
                      key={el.id}
                      element={el}
                      isSelected={selectedElementId === el.id}
                      onSelect={() => selectElement(el.id)}
                      onRemove={() => removeElement(el.id)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
        
        {/* Properties Tab */}
        {activeTab === 'properties' && <PropertiesPanel />}
      </div>
    </div>
  );
}

export default Toolbar;
