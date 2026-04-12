import { useEditorStore } from '../../stores/editorStore';
import { Input } from '../ui/Input';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';

export function PropertiesPanel() {
  const { 
    template, 
    selectedElementId, 
    updateElement, 
    removeElement,
    reorderElements 
  } = useEditorStore();
  
  if (!template || !selectedElementId) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">Sélectionnez un élément pour voir ses propriétés</p>
      </div>
    );
  }
  
  const element = template.elements.find((el) => el.id === selectedElementId);
  if (!element) return null;
  
  const props = element.properties as any;
  
  const handleChange = (updates: Partial<typeof element>) => {
    updateElement(element.id, updates);
  };
  
  const moveLayer = (direction: 'up' | 'down') => {
    const currentIndex = element.zIndex;
    const newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex < 0 || newIndex >= template.elements.length) return;
    
    const newOrder = [...template.elements].sort((a, b) => a.zIndex - b.zIndex);
    const [moved] = newOrder.splice(currentIndex, 1);
    newOrder.splice(newIndex, 0, moved);
    
    reorderElements(newOrder.map((el) => el.id));
  };
  
  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Variable Name */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">Nom de variable</label>
        <Input
          value={element.variableName}
          onChange={(e) => handleChange({ variableName: e.target.value })}
          placeholder="ex: productName"
        />
      </div>
      
      {/* Position & Size */}
      <div className="border-t pt-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Position & Taille</h4>
        <div className="grid grid-cols-2 gap-2">
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
          <Input
            label="Rotation (°)"
            type="number"
            value={Math.round(element.rotation)}
            onChange={(e) => handleChange({ rotation: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
      
      {/* Type-specific properties */}
      {element.type === 'text' && (
        <div className="border-t pt-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Texte</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600">Police</label>
              <select
                value={props.fontFamily || 'Arial'}
                onChange={(e) => handleChange({ properties: { ...props, fontFamily: e.target.value } })}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Taille (pt)"
                type="number"
                value={props.fontSize || 12}
                onChange={(e) => handleChange({ properties: { ...props, fontSize: parseInt(e.target.value) || 12 } })}
              />
              <div>
                <label className="text-xs text-gray-600">Couleur</label>
                <input
                  type="color"
                  value={props.color || '#000000'}
                  onChange={(e) => handleChange({ properties: { ...props, color: e.target.value } })}
                  className="w-full h-8"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">Alignement</label>
                <select
                  value={props.align || 'left'}
                  onChange={(e) => handleChange({ properties: { ...props, align: e.target.value } })}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  <option value="left">Gauche</option>
                  <option value="center">Centre</option>
                  <option value="right">Droite</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Style</label>
                <select
                  value={props.fontWeight === 'bold' ? 'bold' : 'normal'}
                  onChange={(e) => handleChange({ properties: { ...props, fontWeight: e.target.value } })}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Gras</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {element.type === 'barcode' && (
        <div className="border-t pt-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Code-barres</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600">Format</label>
              <select
                value={props.format || 'EAN13'}
                onChange={(e) => handleChange({ properties: { ...props, format: e.target.value } })}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="EAN13">EAN-13</option>
                <option value="EAN8">EAN-8</option>
                <option value="CODE128">Code 128</option>
                <option value="UPC">UPC</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="displayValue"
                checked={props.displayValue !== false}
                onChange={(e) => handleChange({ properties: { ...props, displayValue: e.target.checked } })}
              />
              <label htmlFor="displayValue" className="text-sm">Afficher la valeur</label>
            </div>
          </div>
        </div>
      )}
      
      {element.type === 'qrcode' && (
        <div className="border-t pt-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">QR Code</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600">Correction d'erreur</label>
              <select
                value={props.errorCorrectionLevel || 'M'}
                onChange={(e) => handleChange({ properties: { ...props, errorCorrectionLevel: e.target.value } })}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {element.type === 'rectangle' && (
        <div className="border-t pt-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Rectangle</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600">Couleur de fond</label>
              <input
                type="color"
                value={props.fillColor || '#FFFFFF'}
                onChange={(e) => handleChange({ properties: { ...props, fillColor: e.target.value } })}
                className="w-full h-8"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Couleur de bordure</label>
              <input
                type="color"
                value={props.strokeColor || '#000000'}
                onChange={(e) => handleChange({ properties: { ...props, strokeColor: e.target.value } })}
                className="w-full h-8"
              />
            </div>
            <Input
              label="Épaisseur bordure (mm)"
              type="number"
              step="0.1"
              value={props.strokeWidth || 1}
              onChange={(e) => handleChange({ properties: { ...props, strokeWidth: parseFloat(e.target.value) || 0 } })}
            />
          </div>
        </div>
      )}
      
      {/* Layer controls */}
      <div className="border-t pt-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Calque</h4>
        <div className="flex gap-2">
          <button
            onClick={() => moveLayer('up')}
            disabled={element.zIndex >= template.elements.length - 1}
            className="flex-1 py-1 px-2 bg-gray-100 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronUp size={16} className="inline mr-1" />
            Monter
          </button>
          <button
            onClick={() => moveLayer('down')}
            disabled={element.zIndex <= 0}
            className="flex-1 py-1 px-2 bg-gray-100 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronDown size={16} className="inline mr-1" />
            Descendre
          </button>
        </div>
      </div>
      
      {/* Actions */}
      <div className="border-t pt-4">
        <button
          onClick={() => removeElement(element.id)}
          className="w-full py-2 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100 flex items-center justify-center gap-2"
        >
          <Trash2 size={16} />
          Supprimer
        </button>
      </div>
    </div>
  );
}
