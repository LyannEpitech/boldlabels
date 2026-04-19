import { useRef, useEffect } from 'react';
import { Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../../../stores/editorStore';
import type { TemplateElement, TextProperties } from '../../../types';

const MM_TO_PX = 3.7795275591;

function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

interface TextElementProps {
  element: TemplateElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<TemplateElement>) => void;
  onDragStart?: () => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: () => void;
}

export function TextElement({ element, isSelected, onSelect, onChange, onDragStart, onDragMove, onDragEnd }: TextElementProps) {
  const shapeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const props = element.properties as TextProperties;
  const { snapToGrid, gridSize } = useEditorStore();
  
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);
  
  const x = mmToPx(element.x);
  const y = mmToPx(element.y);
  const width = mmToPx(element.width);
  const height = mmToPx(element.height);
  
  // Convert pt to px (1pt ≈ 1.333px)
  const fontSizePx = (props.fontSize || 12) * 1.333;
  
  // Build font style string
  let fontStyle = '';
  if (props.fontStyle === 'italic') fontStyle += 'italic ';
  if (props.fontWeight === 'bold') fontStyle += 'bold ';
  
  return (
    <>
      <Text
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        text={element.variableName}
        fontFamily={props.fontFamily || 'Arial'}
        fontSize={fontSizePx}
        fontStyle={fontStyle.trim() || undefined}
        fill={props.color || '#000000'}
        align={props.align || 'left'}
        verticalAlign={props.verticalAlign || 'top'}
        wrap="word"
        ellipsis={true}
        rotation={element.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          let x = e.target.x() / MM_TO_PX;
          let y = e.target.y() / MM_TO_PX;
          if (snapToGrid) {
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
          }
          onChange({ x, y });
          onDragEnd?.();
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          
          onChange({
            x: node.x() / MM_TO_PX,
            y: node.y() / MM_TO_PX,
            width: (node.width() * scaleX) / MM_TO_PX,
            height: (node.height() * scaleY) / MM_TO_PX,
            rotation: node.rotation(),
          });
          
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
}
