import { useRef, useEffect, useState } from 'react';
import { Rect, Transformer, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../../../stores/editorStore';
import type { TemplateElement, BarcodeProperties } from '../../../types';
import JsBarcode from 'jsbarcode';

const MM_TO_PX = 3.7795275591;

function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

interface BarcodeElementProps {
  element: TemplateElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<TemplateElement>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function BarcodeElement({ element, isSelected, onSelect, onChange, onDragStart, onDragEnd }: BarcodeElementProps) {
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const { snapToGrid, gridSize } = useEditorStore();
  const [barcodeImage, setBarcodeImage] = useState<HTMLImageElement | null>(null);
  const props = element.properties as BarcodeProperties;
  
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);
  
  // Generate barcode
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 100;
    
    try {
      // Try to generate barcode with actual value
      JsBarcode(canvas, element.variableName || '123456789012', {
        format: props.format || 'EAN13',
        width: 2,
        height: 50,
        displayValue: props.displayValue !== false,
        fontSize: 14,
        lineColor: props.lineColor || '#000000',
        background: props.backgroundColor || '#FFFFFF',
        margin: 0,
      });
      
      const img = new Image();
      img.src = canvas.toDataURL();
      img.onload = () => setBarcodeImage(img);
    } catch (e) {
      // Fallback: draw placeholder with error message
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = props.backgroundColor || '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = props.lineColor || '#000000';
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999999';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Invalid ' + (props.format || 'EAN13'), canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText(element.variableName.slice(0, 15), canvas.width / 2, canvas.height / 2 + 10);
      }
      
      const img = new Image();
      img.src = canvas.toDataURL();
      img.onload = () => setBarcodeImage(img);
    }
  }, [element.variableName, props.format, props.displayValue, props.lineColor, props.backgroundColor]);
  
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
        fill={props.backgroundColor || '#FFFFFF'}
        stroke={isSelected ? '#3b82f6' : props.lineColor || '#000000'}
        strokeWidth={isSelected ? 2 : 1}
        rotation={element.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onDragStart}
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
      {barcodeImage && (
        <KonvaImage
          image={barcodeImage}
          x={x + 2}
          y={y + 2}
          width={width - 4}
          height={height - 4}
          listening={false}
        />
      )}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 10) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
}
