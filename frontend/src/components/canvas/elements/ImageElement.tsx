import { useRef, useEffect, useState } from 'react';
import { Rect, Transformer, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../../../stores/editorStore';
import type { TemplateElement, ImageProperties } from '../../../types';

const MM_TO_PX = 3.7795275591;

function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

interface ImageElementProps {
  onDragStart?: () => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: () => void;
  element: TemplateElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<TemplateElement>) => void;
}

export function ImageElement({ element, isSelected, onSelect, onChange, onDragStart, onDragMove, onDragEnd }: ImageElementProps) {
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const { snapToGrid, gridSize } = useEditorStore();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const props = element.properties as ImageProperties;
  
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);
  
  // Load image
  useEffect(() => {
    if (props.src) {
      const img = new Image();
      img.src = props.src;
      img.onload = () => setImage(img);
      img.onerror = () => setImage(null);
    } else {
      setImage(null);
    }
  }, [props.src]);
  
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
        fill="#f3f4f6"
        stroke={isSelected ? '#3b82f6' : '#d1d5db'}
        strokeWidth={isSelected ? 2 : 1}
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
      {image && (
        <KonvaImage
          image={image}
          x={x}
          y={y}
          width={width}
          height={height}
          listening={false}
          {...(props.objectFit === 'cover' ? { crop: { x: 0, y: 0, width: image.width, height: image.height } } : {})}
        />
      )}
      {!image && (
        <Rect
          x={x + width / 2 - 12}
          y={y + height / 2 - 12}
          width={24}
          height={24}
          fill="#d1d5db"
          listening={false}
        />
      )}
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
