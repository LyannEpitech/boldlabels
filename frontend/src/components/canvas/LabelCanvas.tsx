import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { TextElement } from './elements/TextElement';
import { BarcodeElement } from './elements/BarcodeElement';
import { QRCodeElement } from './elements/QRCodeElement';
import { ImageElement } from './elements/ImageElement';
import { RectangleElement } from './elements/RectangleElement';
import SmartGuides from './SmartGuides';
import type { TemplateElement } from '../../types';

const MM_TO_PX = 3.7795275591;

function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

interface CanvasElementProps {
  element: TemplateElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<TemplateElement>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

function CanvasElement({ element, isSelected, onSelect, onChange, onDragStart, onDragEnd }: CanvasElementProps) {
  const commonProps = {
    element,
    isSelected,
    onSelect,
    onChange,
    onDragStart,
    onDragEnd
  };

  switch (element.type) {
    case 'text':
      return <TextElement {...commonProps} />;
    case 'barcode':
      return <BarcodeElement {...commonProps} />;
    case 'qrcode':
      return <QRCodeElement {...commonProps} />;
    case 'image':
      return <ImageElement {...commonProps} />;
    case 'rectangle':
      return <RectangleElement {...commonProps} />;
    default:
      return null;
  }
}

interface LabelCanvasProps {
  showSmartGuides?: boolean;
}

export function LabelCanvas({ showSmartGuides = false }: LabelCanvasProps) {
  const { template, selectedElementId, selectElement, updateElement, zoom, showGrid } = useEditorStore();
  const [draggedElement, setDraggedElement] = useState<TemplateElement | null>(null);
  
  if (!template) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">Aucun template sélectionné</p>
          <p className="text-gray-400 text-sm">Créez un nouveau template pour commencer</p>
        </div>
      </div>
    );
  }
  
  const width = mmToPx(template.width);
  const height = mmToPx(template.height);
  
  // Grid lines
  const gridLines = [];
  if (showGrid) {
    const gridSize = mmToPx(5);
    for (let x = 0; x <= width; x += gridSize) {
      gridLines.push(<Rect key={`v-${x}`} x={x} y={0} width={1} height={height} fill="#e5e7eb" />);
    }
    for (let y = 0; y <= height; y += gridSize) {
      gridLines.push(<Rect key={`h-${y}`} x={0} y={y} width={width} height={1} fill="#e5e7eb" />);
    }
  }
  
  // Label border
  const labelBorder = (
    <Rect
      x={0}
      y={0}
      width={width}
      height={height}
      fill={template.backgroundColor}
      stroke={template.borderColor}
      strokeWidth={mmToPx(template.borderWidth)}
      cornerRadius={template.borderRadius}
      listening={false}
    />
  );
  
  const sortedElements = [...template.elements].sort((a, b) => a.zIndex - b.zIndex);
  
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      selectElement(null);
    }
  };

  const handleDragStart = (element: TemplateElement) => {
    setDraggedElement(element);
  };

  const handleDragEnd = () => {
    setDraggedElement(null);
  };
  
  return (
    <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-8">
      <div
        className="bg-white shadow-xl"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <Stage width={width} height={height} onClick={handleStageClick}>
          <Layer>
            {labelBorder}
            {gridLines}
          </Layer>
          <Layer>
            {sortedElements.map((element) => (
              <CanvasElement
                key={element.id}
                element={element}
                isSelected={selectedElementId === element.id}
                onSelect={() => selectElement(element.id)}
                onChange={(updates) => updateElement(element.id, updates)}
                onDragStart={() => handleDragStart(element)}
                onDragEnd={handleDragEnd}
              />
            ))}

            {/* Smart Guides */}
            {showSmartGuides && (
              <SmartGuides
                elements={template.elements}
                selectedElementId={selectedElementId}
                draggedElement={draggedElement}
                canvasWidth={width}
                canvasHeight={height}
                scale={zoom}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
