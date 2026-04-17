import { useRef, useEffect, useState } from 'react';
import { Rect, Transformer, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../../../stores/editorStore';
import type { TemplateElement, QRCodeProperties } from '../../../types';
import QRCode from 'qrcode';

const MM_TO_PX = 3.7795275591;

function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

interface QRCodeElementProps {
  onDragStart?: () => void;
  onDragEnd?: () => void;
  element: TemplateElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<TemplateElement>) => void;
}

export function QRCodeElement({ element, isSelected, onSelect, onChange, onDragStart, onDragEnd }: QRCodeElementProps) {
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const { snapToGrid, gridSize } = useEditorStore();
  const [qrImage, setQrImage] = useState<HTMLImageElement | null>(null);
  const props = element.properties as QRCodeProperties;
  
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);
  
  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(element.variableName || 'https://example.com', {
          width: 200,
          margin: 1,
          color: {
            dark: props.color || '#000000',
            light: props.backgroundColor || '#FFFFFF',
          },
          errorCorrectionLevel: (props.errorCorrectionLevel || 'M') as any,
        });
        
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => setQrImage(img);
      } catch (e) {
        setQrImage(null);
      }
    };
    
    generateQR();
  }, [element.variableName, props.color, props.backgroundColor, props.errorCorrectionLevel]);
  
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
        stroke={isSelected ? '#3b82f6' : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
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
      {qrImage && (
        <KonvaImage
          image={qrImage}
          x={x}
          y={y}
          width={width}
          height={height}
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
