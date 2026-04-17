import React, { useState, useEffect } from 'react';
import { Template, TemplateElement } from '../types';
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

interface LivePreviewProps {
  template: Template;
  isOpen: boolean;
  onClose: () => void;
}

// Sample data for preview
const sampleData: Record<string, string> = {
  nom: 'Produit Exemple',
  prix: '9,99',
  ean: '3760001000001',
  categorie: 'Électronique',
  url: 'https://boldlabels.app'
};

const BarcodePreview: React.FC<{ element: TemplateElement; value: string }> = ({ element, value }) => {
  return (
    <Rect
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      fill="#f0f0f0"
      stroke="#ccc"
      strokeWidth={1}
    />
  );
};

const QRCodePreview: React.FC<{ element: TemplateElement; value: string }> = ({ element, value }) => {
  const properties = JSON.parse(element.properties || '{}');
  const bgColor = properties.backgroundColor || '#FFFFFF';
  
  return (
    <Rect
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      fill={bgColor}
      stroke="#ccc"
      strokeWidth={1}
    />
  );
};

const LivePreview: React.FC<LivePreviewProps> = ({ template, isOpen, onClose }) => {
  const [scale, setScale] = useState(2);
  const stageWidth = template.width * scale;
  const stageHeight = template.height * scale;

  const renderElement = (element: TemplateElement) => {
    const properties = JSON.parse(element.properties || '{}');
    const value = sampleData[element.variableName] || `[${element.variableName}]`;

    switch (element.type) {
      case 'text':
        const suffix = properties.suffix || '';
        return (
          <Text
            key={element.id}
            x={element.x * scale}
            y={element.y * scale}
            width={element.width * scale}
            height={element.height * scale}
            text={value + suffix}
            fontSize={(properties.fontSize || 12) * scale * 0.35}
            fontFamily={properties.fontFamily || 'helvetica'}
            fontStyle={properties.fontStyle || 'normal'}
            fill={properties.color || '#000000'}
            align={properties.align || 'left'}
            verticalAlign={properties.verticalAlign || 'top'}
            rotation={element.rotation}
          />
        );

      case 'barcode':
        return (
          <BarcodePreview
            key={element.id}
            element={{ ...element, x: element.x * scale, y: element.y * scale, width: element.width * scale, height: element.height * scale }}
            value={value}
          />
        );

      case 'qrcode':
        return (
          <QRCodePreview
            key={element.id}
            element={{ ...element, x: element.x * scale, y: element.y * scale, width: element.width * scale, height: element.height * scale }}
            value={value}
          />
        );

      case 'image':
        return (
          <Rect
            key={element.id}
            x={element.x * scale}
            y={element.y * scale}
            width={element.width * scale}
            height={element.height * scale}
            fill="#e0e0e0"
            stroke="#ccc"
            strokeWidth={1}
          />
        );

      case 'rectangle':
        const rectProps = JSON.parse(element.properties || '{}');
        return (
          <Rect
            key={element.id}
            x={element.x * scale}
            y={element.y * scale}
            width={element.width * scale}
            height={element.height * scale}
            fill={rectProps.fillColor || 'transparent'}
            stroke={rectProps.strokeColor || '#000000'}
            strokeWidth={rectProps.strokeWidth || 1}
            rotation={element.rotation}
          />
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l z-40 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">Aperçu</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div className="mb-4 text-sm text-gray-600">
          Données d'exemple :
          <ul className="mt-1 space-y-1 text-xs">
            {Object.entries(sampleData).map(([key, value]) => (
              <li key={key}>
                <span className="font-mono bg-gray-200 px-1 rounded">{key}</span>: {value}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <Stage
            width={stageWidth}
            height={stageHeight}
            scaleX={1}
            scaleY={1}
          >
            <Layer>
              {/* Background */}
              <Rect
                x={0}
                y={0}
                width={stageWidth}
                height={stageHeight}
                fill={template.backgroundColor}
              />

              {/* Border */}
              {template.borderWidth > 0 && (
                <Rect
                  x={0}
                  y={0}
                  width={stageWidth}
                  height={stageHeight}
                  stroke={template.borderColor}
                  strokeWidth={template.borderWidth * scale}
                  cornerRadius={(template.borderRadius || 0) * scale}
                />
              )}

              {/* Elements */}
              {template.elements.map(renderElement)}
            </Layer>
          </Stage>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>Format: {template.width}×{template.height}mm</p>
          <p>{template.elements.length} éléments</p>
        </div>
      </div>
    </div>
  );
};

export default LivePreview;
