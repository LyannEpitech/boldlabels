import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { TextElement } from './elements/TextElement';
import { BarcodeElement } from './elements/BarcodeElement';
import { QRCodeElement } from './elements/QRCodeElement';
import { ImageElement } from './elements/ImageElement';
import { RectangleElement } from './elements/RectangleElement';
import SmartGuides from './SmartGuides';
import SelectionBox from './SelectionBox';
import Guides from './Guides';
import type { TemplateElement } from '../../types';

const MM_TO_PX = 3.7795275591;

function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

interface CanvasElementProps {
  element: TemplateElement;
  isSelected: boolean;
  onSelect: (e?: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (updates: Partial<TemplateElement>) => void;
  onDragStart?: () => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: () => void;
}

function CanvasElement({ element, isSelected, onSelect, onChange, onDragStart, onDragMove, onDragEnd }: CanvasElementProps) {
  const commonProps = {
    element,
    isSelected,
    onSelect,
    onChange,
    onDragStart,
    onDragMove,
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
  const store = useEditorStore();
  const { 
    template, 
    selectedElementId, 
    selectedElementIds,
    selectElement, 
    toggleElementSelection,
    updateElement, 
    zoom, 
    showGrid 
  } = store;
  const [draggedElement, setDraggedElement] = useState<TemplateElement | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  
  if (!template) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-sunken">
        <div className="text-center">
          <p className="text-text-secondary text-lg mb-2">Aucun template sélectionné</p>
          <p className="text-text-muted text-sm">Créez un nouveau template pour commencer</p>
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
  
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target !== e.target.getStage()) return;
    
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    
    setIsSelecting(true);
    setSelectionStart(pos);
    setSelectionCurrent(pos);
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isSelecting) return;
    
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    
    setSelectionCurrent(pos);
  };

  const handleStageMouseUp = () => {
    if (!isSelecting) return;
    
    const boxWidth = Math.abs(selectionCurrent.x - selectionStart.x);
    const boxHeight = Math.abs(selectionCurrent.y - selectionStart.y);
    
    // Only trigger if selection is significant
    if (boxWidth > 5 && boxHeight > 5) {
      store.endSelectionBox();
    }
    
    setIsSelecting(false);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage() && !isSelecting) {
      const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;
      if (!isCtrlPressed) {
        selectElement(null);
      }
    }
  };

  const handleElementSelect = (elementId: string, isCtrlPressed: boolean) => {
    if (isCtrlPressed) {
      toggleElementSelection(elementId);
    } else {
      selectElement(elementId);
    }
  };

  // Note: handleSelectionEnd logic moved to store (endSelectionBox) for single source of truth

  const handleDragStart = (element: TemplateElement) => {
    setDraggedElement(element);
    setDragPosition({ x: element.x, y: element.y });
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!draggedElement) return;
    const pos = e.target.position();
    setDragPosition({
      x: Math.round((pos.x / MM_TO_PX) * 10) / 10,
      y: Math.round((pos.y / MM_TO_PX) * 10) / 10,
    });
  };

  const handleDragEnd = () => {
    setDraggedElement(null);
    setDragPosition(null);
  };
  
  return (
    <div className="flex-1 bg-surface-sunken flex items-center justify-center overflow-auto p-8">
      <div
        className="bg-white shadow-xl"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <Stage 
          width={width} 
          height={height} 
          onClick={handleStageClick}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onMouseLeave={handleStageMouseUp}
        >
          <Layer>
            {labelBorder}
            {gridLines}
          </Layer>
          <Layer>
            {sortedElements.map((element) => (
              <CanvasElement
                key={element.id}
                element={element}
                isSelected={selectedElementIds.includes(element.id) || selectedElementId === element.id}
                onSelect={(e) => {
                  const isCtrlPressed = e?.evt?.ctrlKey || e?.evt?.metaKey || false;
                  handleElementSelect(element.id, isCtrlPressed);
                }}
                onChange={(updates) => updateElement(element.id, updates)}
                onDragStart={() => handleDragStart(element)}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              />
            ))}

            {/* Position Indicator during drag */}
            {dragPosition && draggedElement && (
              <Text
                x={draggedElement.x * MM_TO_PX}
                y={draggedElement.y * MM_TO_PX - 20}
                text={`X: ${dragPosition.x}mm  Y: ${dragPosition.y}mm`}
                fontSize={10}
                fill="#6366F1"
                fontFamily="monospace"
                padding={4}
                background="#EEF2FF"
              />
            )}

            {/* Rubber Band Selection Box */}
            <SelectionBox
              isSelecting={isSelecting}
              startPos={selectionStart}
              currentPos={selectionCurrent}
              scale={zoom}
            />

            {/* Custom Guides */}
            <Guides canvasWidth={width} canvasHeight={height} />

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
