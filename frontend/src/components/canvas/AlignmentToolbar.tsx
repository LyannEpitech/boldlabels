import { useEditorStore } from '../../stores/editorStore';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignVerticalJustifyCenter,
  AlignStartVertical,
  AlignEndVertical,
  Grid3X3,
  Magnet
} from 'lucide-react';

export function AlignmentToolbar() {
  const { 
    selectedElementId, 
    alignElements, 
    snapToGrid, 
    setSnapToGrid,
    gridSize,
  } = useEditorStore();
  
  const hasSelection = !!selectedElementId;
  
  return (
    <div className="flex items-center gap-1 p-2 bg-gray-50 border-b">
      <span className="text-xs text-gray-500 mr-2">Aligner:</span>
      
      <button
        onClick={() => alignElements('left')}
        disabled={!hasSelection}
        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Gauche"
      >
        <AlignLeft size={16} />
      </button>
      
      <button
        onClick={() => alignElements('center')}
        disabled={!hasSelection}
        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Centre (horizontal)"
      >
        <AlignCenter size={16} />
      </button>
      
      <button
        onClick={() => alignElements('right')}
        disabled={!hasSelection}
        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Droite"
      >
        <AlignRight size={16} />
      </button>
      
      <div className="w-px h-4 bg-gray-300 mx-1" />
      
      <button
        onClick={() => alignElements('top')}
        disabled={!hasSelection}
        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Haut"
      >
        <AlignStartVertical size={16} />
      </button>
      
      <button
        onClick={() => alignElements('middle')}
        disabled={!hasSelection}
        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Milieu (vertical)"
      >
        <AlignVerticalJustifyCenter size={16} />
      </button>
      
      <button
        onClick={() => alignElements('bottom')}
        disabled={!hasSelection}
        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Bas"
      >
        <AlignEndVertical size={16} />
      </button>
      
      <div className="w-px h-4 bg-gray-300 mx-1" />
      
      <button
        onClick={() => setSnapToGrid(!snapToGrid)}
        className={`p-1.5 rounded flex items-center gap-1 ${snapToGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
        title="Aligner sur la grille"
      >
        <Magnet size={16} />
        <Grid3X3 size={14} />
      </button>
      
      {snapToGrid && (
        <span className="text-xs text-gray-500 ml-1">{gridSize}mm</span>
      )}
    </div>
  );
}
