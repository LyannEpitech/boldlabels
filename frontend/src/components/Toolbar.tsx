import { useState } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { PropertiesPanel } from './canvas/PropertiesPanel';
import { Type, Square, Box, Image as ImageIcon, Trash2, Undo2, Redo2, Grid3X3, ZoomIn, ZoomOut } from 'lucide-react';

const tools = [
  { type: 'text' as const, icon: Type, label: 'Texte' },
  { type: 'barcode' as const, icon: Box, label: 'Code-barres' },
  { type: 'qrcode' as const, icon: Box, label: 'QR Code' },
  { type: 'image' as const, icon: ImageIcon, label: 'Image' },
  { type: 'rectangle' as const, icon: Square, label: 'Rectangle' },
];

export function Toolbar() {
  const {
    template,
    addElement,
    selectedElementId,
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
  
  const [activeTab, setActiveTab] = useState<'tools' | 'properties'>('tools');
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  const handleAddElement = (type: typeof tools[0]['type']) => {
    const defaults: Record<string, any> = {
      text: {
        properties: {
          fontFamily: 'Arial',
          fontSize: 12,
          fontWeight: 'normal',
          color: '#000000',
          align: 'left',
          verticalAlign: 'top',
        },
      },
      barcode: {
        properties: {
          format: 'EAN13',
          displayValue: true,
          lineColor: '#000000',
          backgroundColor: '#FFFFFF',
        },
      },
      qrcode: {
        properties: {
          errorCorrectionLevel: 'M',
          color: '#000000',
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
          strokeColor: '#000000',
          strokeWidth: 1,
        },
      },
    };
    
    addElement({
      type,
      variableName: `var_${type}`,
      x: 10,
      y: 10,
      width: type === 'qrcode' ? 20 : 40,
      height: type === 'qrcode' ? 20 : 15,
      rotation: 0,
      ...defaults[type],
    });
  };
  
  return (
    <div className="w-72 bg-white border-l flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold text-gray-800">🏷️ BoldLabels</h1>
        {template && <p className="text-sm text-gray-500 truncate">{template.name}</p>}
      </div>
      
      {/* Top toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="flex gap-1">
          <button onClick={undo} disabled={!canUndo} className="p-2 rounded hover:bg-gray-200 disabled:opacity-30" title="Annuler">
            <Undo2 size={16} />
          </button>
          <button onClick={redo} disabled={!canRedo} className="p-2 rounded hover:bg-gray-200 disabled:opacity-30" title="Rétablir">
            <Redo2 size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(zoom - 0.25)} disabled={zoom <= 0.25} className="p-2 rounded hover:bg-gray-200 disabled:opacity-30">
            <ZoomOut size={16} />
          </button>
          <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(zoom + 0.25)} disabled={zoom >= 3} className="p-2 rounded hover:bg-gray-200 disabled:opacity-30">
            <ZoomIn size={16} />
          </button>
        </div>
        
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded ${showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
          title="Grille"
        >
          <Grid3X3 size={16} />
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'tools' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          Outils
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'properties' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          Propriétés
        </button>
      </div>
      
      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {!template ? (
            <p className="text-gray-500 text-sm">Créez un template pour commencer</p>
          ) : (
            <>
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-2">Ajouter</h3>
                <div className="grid grid-cols-2 gap-2">
                  {tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.type}
                        onClick={() => handleAddElement(tool.type)}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        <Icon size={20} className="text-gray-600" />
                        <span className="text-xs text-gray-700">{tool.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium text-sm text-gray-700 mb-2">Calques</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {[...(template?.elements || [])]
                    .sort((a, b) => b.zIndex - a.zIndex)
                    .map((el: any) => (
                      <div
                        key={el.id}
                        onClick={() => useEditorStore.getState().selectElement(el.id)}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm ${
                          selectedElementId === el.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                        }`}
                      >
                        <span className="truncate">{el.variableName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeElement(el.id);
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Properties Tab */}
      {activeTab === 'properties' && <PropertiesPanel />}
    </div>
  );
}
