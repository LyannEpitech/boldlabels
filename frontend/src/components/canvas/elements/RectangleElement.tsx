import { useRef, useEffect } from 'react';
import { Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../../../stores/editorStore';
import type { TemplateElement, RectangleProperties } from '../../../types';

const MM_TO_PX = 3.7795275591;

function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

interface RectangleElementProps {
  element: TemplateElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<TemplateElement>) => void;
}

export function RectangleElement({ element, isSelected, onSelect, onChange }: RectangleElementProps) {
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const { snapToGrid, gridSize } = useEditorStore();
  const props = element.properties as RectangleProperties;
  
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
  
  return (
    <>
      <Rect
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        fill={props.fillColor || 'transparent'}
        stroke={props.strokeColor || '#000000'}
        strokeWidth={mmToPx(props.strokeWidth || 1)}
        rotation={element.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          let x = e.target.x() / MM_TO_PX;
          let y = e.target.y() / MM_TO_PX;
          if (snapToGrid) {
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
          }
          onChange({ x, y });
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
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
}
