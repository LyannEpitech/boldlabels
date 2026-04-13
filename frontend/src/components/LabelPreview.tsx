import { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva';
import type { Template, TemplateElement } from '../types';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

const MM_TO_PX = 3.7795275591;

interface LabelPreviewProps {
  template: Template;
  rowData: string[];
  csvHeaders: string[];
  mapping: Record<string, number>;
  scale?: number;
}

export function LabelPreview({ template, rowData, mapping, scale = 0.5 }: LabelPreviewProps) {
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const width = template.width * MM_TO_PX * scale;
  const height = template.height * MM_TO_PX * scale;

  // Generate barcodes and QR codes
  useEffect(() => {
    const generateImages = async () => {
      const newImages: Record<string, HTMLImageElement> = {};

      for (const element of template.elements) {
        const colIndex = mapping[element.variableName];
        const value = colIndex !== undefined ? rowData[colIndex] || '' : element.variableName;

        if (element.type === 'barcode') {
          const canvas = document.createElement('canvas');
          try {
            const props = element.properties as any;
            JsBarcode(canvas, value || '123456789012', {
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
            await new Promise((resolve) => { img.onload = resolve; });
            newImages[element.id] = img;
          } catch (e) {
            // Create placeholder for invalid barcode
            canvas.width = 200;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const props = element.properties as any;
              ctx.fillStyle = props.backgroundColor || '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.strokeStyle = props.lineColor || '#000000';
              ctx.strokeRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#999999';
              ctx.font = '12px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('Invalid ' + (props.format || 'EAN13'), canvas.width / 2, canvas.height / 2);
            }
            const img = new Image();
            img.src = canvas.toDataURL();
            await new Promise((resolve) => { img.onload = resolve; });
            newImages[element.id] = img;
          }
        } else if (element.type === 'qrcode') {
          try {
            const props = element.properties as any;
            const dataUrl = await QRCode.toDataURL(value || 'https://example.com', {
              width: 200,
              margin: 1,
              color: {
                dark: props.color || '#000000',
                light: props.backgroundColor || '#FFFFFF',
              },
            });
            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => { img.onload = resolve; });
            newImages[element.id] = img;
          } catch (e) {
            console.error('QR generation failed:', e);
          }
        } else if (element.type === 'image') {
          const props = element.properties as any;
          const src = value || props.src;
          if (src) {
            const img = new Image();
            img.src = src;
            await new Promise((resolve, reject) => { 
              img.onload = resolve; 
              img.onerror = reject;
            }).catch(() => {});
            if (img.complete) {
              newImages[element.id] = img;
            }
          }
        }
      }

      setImages(newImages);
    };

    generateImages();
  }, [template, rowData, mapping]);

  const getValue = (element: TemplateElement): string => {
    const colIndex = mapping[element.variableName];
    return colIndex !== undefined ? rowData[colIndex] || '' : element.variableName;
  };

  return (
    <Stage width={width} height={height} scaleX={scale} scaleY={scale}>
      <Layer>
        {/* Background */}
        <Rect
          x={0}
          y={0}
          width={template.width * MM_TO_PX}
          height={template.height * MM_TO_PX}
          fill={template.backgroundColor}
          stroke={template.borderColor}
          strokeWidth={template.borderWidth * MM_TO_PX}
        />

        {/* Elements */}
        {template.elements.map((element) => {
          const x = element.x * MM_TO_PX;
          const y = element.y * MM_TO_PX;
          const w = element.width * MM_TO_PX;
          const h = element.height * MM_TO_PX;
          const value = getValue(element);

          switch (element.type) {
            case 'text':
              const textProps = element.properties as any;
              const fontSizePx = (textProps.fontSize || 12) * 1.333;
              return (
                <Text
                  key={element.id}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  text={value}
                  fontFamily={textProps.fontFamily || 'Arial'}
                  fontSize={fontSizePx}
                  fill={textProps.color || '#000000'}
                  align={textProps.align || 'left'}
                  verticalAlign={textProps.verticalAlign || 'top'}
                  wrap="word"
                />
              );

            case 'barcode':
            case 'qrcode':
            case 'image':
              const img = images[element.id];
              if (!img) return null;
              return (
                <KonvaImage
                  key={element.id}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  image={img}
                />
              );

            case 'rectangle':
              const rectProps = element.properties as any;
              return (
                <Rect
                  key={element.id}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={rectProps.fillColor || 'transparent'}
                  stroke={rectProps.strokeColor || '#000000'}
                  strokeWidth={(rectProps.strokeWidth || 1) * MM_TO_PX}
                />
              );

            default:
              return null;
          }
        })}
      </Layer>
    </Stage>
  );
}
