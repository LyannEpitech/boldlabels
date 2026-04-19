import { useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Type,
  Palette,
  Move,
  Settings,
  Bold,
  Italic,
  Underline,
  Lock,
  EyeOff
} from 'lucide-react';

// Accordion Section Component
interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionSection = ({ title, icon, children, defaultOpen = true }: AccordionSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-sunken transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-text-muted">{icon}</span>
          <span className="text-sm font-medium text-text-primary">{title}</span>
        </div>
        <ChevronRight 
          className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-90' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};

// Toggle Button Component
interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}

const ToggleButton = ({ active, onClick, children, title }: ToggleButtonProps) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-md transition-all ${
      active 
        ? 'bg-brand-100 text-brand-600' 
        : 'bg-surface-sunken text-text-muted hover:text-text-secondary'
    }`}
  >
    {children}
  </button>
);

// Color Picker Component
interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const ColorPicker = ({ value, onChange, label }: ColorPickerProps) => (
  <div>
    {label && <label className="text-xs text-text-muted mb-1.5 block">{label}</label>}
    <div className="flex gap-2">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer border border-border opacity-0 absolute inset-0"
        />
        <div 
          className="w-10 h-10 rounded-lg border border-border shadow-sm"
          style={{ backgroundColor: value }}
        />
      </div>
      <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
    </div>
  </div>
);

// Font Selector Component
const FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial', family: 'Arial, sans-serif' },
  { value: 'Helvetica', label: 'Helvetica', family: 'Helvetica, sans-serif' },
  { value: 'Times New Roman', label: 'Times New Roman', family: '"Times New Roman", serif' },
  { value: 'Georgia', label: 'Georgia', family: 'Georgia, serif' },
  { value: 'Courier New', label: 'Courier New', family: '"Courier New", monospace' },
  { value: 'Verdana', label: 'Verdana', family: 'Verdana, sans-serif' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS', family: '"Trebuchet MS", sans-serif' },
  { value: 'Impact', label: 'Impact', family: 'Impact, sans-serif' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS', family: '"Comic Sans MS", cursive' },
  { value: 'Inter', label: 'Inter', family: 'Inter, sans-serif' },
  { value: 'Roboto', label: 'Roboto', family: 'Roboto, sans-serif' },
  { value: 'Open Sans', label: 'Open Sans', family: '"Open Sans", sans-serif' },
];

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
}

const FontSelector = ({ value, onChange }: FontSelectorProps) => (
  <div className="relative">
    <label className="text-xs text-text-muted mb-1.5 block">Police</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none cursor-pointer"
      style={{ fontFamily: FONT_OPTIONS.find(f => f.value === value)?.family || 'Arial' }}
    >
      {FONT_OPTIONS.map((font) => (
        <option 
          key={font.value} 
          value={font.value}
          style={{ fontFamily: font.family }}
        >
          {font.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-3 top-[29px] w-4 h-4 text-text-muted pointer-events-none" />
  </div>
);

// Opacity Slider Component
interface OpacitySliderProps {
  value: number;
  onChange: (opacity: number) => void;
}

const OpacitySlider = ({ value, onChange }: OpacitySliderProps) => (
  <div>
    <label className="text-xs text-text-muted mb-1.5 block flex justify-between">
      <span>Opacité</span>
      <span>{Math.round(value * 100)}%</span>
    </label>
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-surface-sunken rounded-lg appearance-none cursor-pointer accent-brand-500"
    />
  </div>
);

export function PropertiesPanel() {
  const { 
    template, 
    selectedElementId, 
    selectedElementIds,
    updateElement, 
    removeElement,
    removeMultipleElements
  } = useEditorStore();
  
  if (!template) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-text-muted">Sélectionnez un élément pour voir ses propriétés</p>
      </div>
    );
  }

  // Multi-selection mode
  const isMultiSelect = selectedElementIds.length > 1;
  
  if (isMultiSelect) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border bg-surface-raised">
          <h3 className="font-medium text-text-primary">{selectedElementIds.length} éléments sélectionnés</h3>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Card padding="sm">
            <p className="text-sm text-text-secondary mb-3">Actions groupe</p>
            <div className="space-y-2">
              <Button 
                variant="danger" 
                className="w-full"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => removeMultipleElements(selectedElementIds)}
              >
                Supprimer la sélection
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!selectedElementId) {
    return (
      <div className="p-6 text-center">
        <Settings className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-muted">Sélectionnez un élément pour voir ses propriétés</p>
        <p className="text-xs text-text-muted mt-1">Ctrl+Click pour multi-sélection</p>
      </div>
    );
  }
  
  const element = template.elements.find((el) => el.id === selectedElementId);
  if (!element) return null;
  
  const props = element.properties as any;
  
  const handleChange = (updates: Partial<typeof element>) => {
    updateElement(element.id, updates);
  };

  const handlePropertyChange = (key: string, value: any) => {
    handleChange({ 
      properties: { ...props, [key]: value } 
    });
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-surface-raised flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            {element.type === 'text' && <Type className="w-4 h-4 inline mr-1" />}
            {element.type === 'barcode' && <span className="text-lg">▯</span>}
            {element.type === 'qrcode' && <span className="text-lg">▣</span>}
            {element.type}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 className="w-4 h-4" />}
          onClick={() => removeElement(element.id)}
        >
          Supprimer
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* General - Variable Name */}
        <AccordionSection title="Général" icon={<Settings className="w-4 h-4" />}>
          <div className="space-y-3">
            <Input
              label="Nom de variable"
              value={element.variableName}
              onChange={(e) => handleChange({ variableName: e.target.value })}
              placeholder="ex: productName"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                leftIcon={<Lock className="w-3.5 h-3.5" />}
              >
                Verrouiller
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                leftIcon={<EyeOff className="w-3.5 h-3.5" />}
              >
                Masquer
              </Button>
            </div>
          </div>
        </AccordionSection>
        
        {/* Position & Size */}
        <AccordionSection title="Position & Taille" icon={<Move className="w-4 h-4" />}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="X (mm)"
                type="number"
                step="0.1"
                value={Math.round(element.x * 10) / 10}
                onChange={(e) => handleChange({ x: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Y (mm)"
                type="number"
                step="0.1"
                value={Math.round(element.y * 10) / 10}
                onChange={(e) => handleChange({ y: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Largeur"
                type="number"
                step="0.1"
                value={Math.round(element.width * 10) / 10}
                onChange={(e) => handleChange({ width: parseFloat(e.target.value) || 1 })}
              />
              <Input
                label="Hauteur"
                type="number"
                step="0.1"
                value={Math.round(element.height * 10) / 10}
                onChange={(e) => handleChange({ height: parseFloat(e.target.value) || 1 })}
              />
            </div>
            <Input
              label="Rotation (°)"
              type="number"
              value={Math.round(element.rotation)}
              onChange={(e) => handleChange({ rotation: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </AccordionSection>
        
        {/* Type-specific properties */}
        {element.type === 'text' && (
          <AccordionSection title="Style du texte" icon={<Type className="w-4 h-4" />}>
            <div className="space-y-4">
              <FontSelector
                value={props.fontFamily || 'Arial'}
                onChange={(font) => handlePropertyChange('fontFamily', font)}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Taille (pt)"
                  type="number"
                  min="1"
                  max="200"
                  value={props.fontSize || 12}
                  onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value) || 12)}
                />
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Alignement</label>
                  <div className="flex bg-surface-sunken rounded-lg p-1">
                    {['left', 'center', 'right'].map((align) => (
                      <button
                        key={align}
                        onClick={() => handlePropertyChange('align', align)}
                        className={`flex-1 py-1.5 text-xs rounded-md transition-all ${
                          props.align === align 
                            ? 'bg-surface text-text-primary shadow-sm' 
                            : 'text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {align === 'left' && '←'}
                        {align === 'center' && '↔'}
                        {align === 'right' && '→'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <ToggleButton
                  active={props.fontWeight === 'bold'}
                  onClick={() => handlePropertyChange('fontWeight', props.fontWeight === 'bold' ? 'normal' : 'bold')}
                  title="Gras"
                >
                  <Bold className="w-4 h-4" />
                </ToggleButton>
                <ToggleButton
                  active={props.fontStyle === 'italic'}
                  onClick={() => handlePropertyChange('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic')}
                  title="Italique"
                >
                  <Italic className="w-4 h-4" />
                </ToggleButton>
                <ToggleButton
                  active={props.textDecoration === 'underline'}
                  onClick={() => handlePropertyChange('textDecoration', props.textDecoration === 'underline' ? 'none' : 'underline')}
                  title="Souligné"
                >
                  <Underline className="w-4 h-4" />
                </ToggleButton>
              </div>
              
              <ColorPicker
                label="Couleur du texte"
                value={props.color || '#000000'}
                onChange={(color) => handlePropertyChange('color', color)}
              />
              
              <OpacitySlider
                value={props.opacity ?? 1}
                onChange={(opacity) => handlePropertyChange('opacity', opacity)}
              />
            </div>
          </AccordionSection>
        )}
        
        {element.type === 'barcode' && (
          <AccordionSection title="Code-barres" icon={<span className="text-lg">▯</span>}>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Format</label>
                <select
                  value={props.format || 'EAN13'}
                  onChange={(e) => handlePropertyChange('format', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="EAN13">EAN-13</option>
                  <option value="EAN8">EAN-8</option>
                  <option value="CODE128">Code 128</option>
                  <option value="UPC">UPC</option>
                </select>
              </div>
              <ColorPicker
                label="Couleur lignes"
                value={props.lineColor || '#000000'}
                onChange={(color) => handlePropertyChange('lineColor', color)}
              />
            </div>
          </AccordionSection>
        )}
        
        {element.type === 'qrcode' && (
          <AccordionSection title="QR Code" icon={<span className="text-lg">▣</span>}>
            <div className="space-y-3">
              <ColorPicker
                label="Couleur"
                value={props.foregroundColor || '#000000'}
                onChange={(color) => handlePropertyChange('foregroundColor', color)}
              />
              <Input
                label="Contenu (URL)"
                value={props.content || ''}
                onChange={(e) => handlePropertyChange('content', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </AccordionSection>
        )}
        
        {element.type === 'rectangle' && (
          <AccordionSection title="Rectangle" icon={<Palette className="w-4 h-4" />}>
            <div className="space-y-4">
              <ColorPicker
                label="Couleur de fond"
                value={props.fillColor || '#FFFFFF'}
                onChange={(color) => handlePropertyChange('fillColor', color)}
              />
              <ColorPicker
                label="Couleur bordure"
                value={props.borderColor || '#000000'}
                onChange={(color) => handlePropertyChange('borderColor', color)}
              />
              <Input
                label="Épaisseur bordure (px)"
                type="number"
                min="0"
                value={props.borderWidth || 0}
                onChange={(e) => handlePropertyChange('borderWidth', parseInt(e.target.value) || 0)}
              />
              <OpacitySlider
                value={props.opacity ?? 1}
                onChange={(opacity) => handlePropertyChange('opacity', opacity)}
              />
            </div>
          </AccordionSection>
        )}
      </div>
    </div>
  );
}

export default PropertiesPanel;
