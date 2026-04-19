import React, { useEffect, useState } from 'react';
import { Line, Text } from 'react-konva';
import type { TemplateElement } from '../../types';

const MM_TO_PX = 3.7795275591;

interface SmartGuidesProps {
  elements: TemplateElement[];
  selectedElementId: string | null;
  draggedElement: TemplateElement | null;
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
}

interface Guide {
  type: 'horizontal' | 'vertical';
  position: number;
  from: string;
  to: string;
}

interface Distance {
  from: number;
  to: number;
  value: number;
  isHorizontal: boolean;
}

const SNAP_THRESHOLD = 5; // pixels

const SmartGuides: React.FC<SmartGuidesProps> = ({
  elements,
  selectedElementId,
  draggedElement,
  canvasWidth,
  canvasHeight,
  scale
}) => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [distances, setDistances] = useState<Distance[]>([]);

  useEffect(() => {
    if (!draggedElement || !selectedElementId) {
      setGuides([]);
      setDistances([]);
      return;
    }

    const newGuides: Guide[] = [];
    const newDistances: Distance[] = [];

    const draggedBounds = {
      left: draggedElement.x * MM_TO_PX,
      right: (draggedElement.x + draggedElement.width) * MM_TO_PX,
      top: draggedElement.y * MM_TO_PX,
      bottom: (draggedElement.y + draggedElement.height) * MM_TO_PX,
      centerX: (draggedElement.x + draggedElement.width / 2) * MM_TO_PX,
      centerY: (draggedElement.y + draggedElement.height / 2) * MM_TO_PX
    };

    elements.forEach(element => {
      if (element.id === selectedElementId) return;

      const bounds = {
        left: element.x * MM_TO_PX,
        right: (element.x + element.width) * MM_TO_PX,
        top: element.y * MM_TO_PX,
        bottom: (element.y + element.height) * MM_TO_PX,
        centerX: (element.x + element.width / 2) * MM_TO_PX,
        centerY: (element.y + element.height / 2) * MM_TO_PX
      };

      // Vertical alignments
      const verticalAlignments = [
        { pos: bounds.left, name: 'left' },
        { pos: bounds.right, name: 'right' },
        { pos: bounds.centerX, name: 'center' }
      ];

      verticalAlignments.forEach(align => {
        if (Math.abs(draggedBounds.left - align.pos) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'vertical', position: align.pos, from: 'left', to: align.name });
        }
        if (Math.abs(draggedBounds.right - align.pos) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'vertical', position: align.pos, from: 'right', to: align.name });
        }
        if (Math.abs(draggedBounds.centerX - align.pos) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'vertical', position: align.pos, from: 'center', to: align.name });
        }
      });

      // Horizontal alignments
      const horizontalAlignments = [
        { pos: bounds.top, name: 'top' },
        { pos: bounds.bottom, name: 'bottom' },
        { pos: bounds.centerY, name: 'middle' }
      ];

      horizontalAlignments.forEach(align => {
        if (Math.abs(draggedBounds.top - align.pos) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'horizontal', position: align.pos, from: 'top', to: align.name });
        }
        if (Math.abs(draggedBounds.bottom - align.pos) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'horizontal', position: align.pos, from: 'bottom', to: align.name });
        }
        if (Math.abs(draggedBounds.centerY - align.pos) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'horizontal', position: align.pos, from: 'middle', to: align.name });
        }
      });

      // Calculate distances
      if (draggedBounds.right < bounds.left) {
        const dist = bounds.left - draggedBounds.right;
        newDistances.push({
          from: draggedBounds.right,
          to: bounds.left,
          value: dist,
          isHorizontal: true
        });
      }
      if (draggedBounds.bottom < bounds.top) {
        const dist = bounds.top - draggedBounds.bottom;
        newDistances.push({
          from: draggedBounds.bottom,
          to: bounds.top,
          value: dist,
          isHorizontal: false
        });
      }
    });

    // Canvas center lines (canvasWidth/Height are already in px)
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

    if (Math.abs(draggedBounds.centerX - canvasCenterX) < SNAP_THRESHOLD) {
      newGuides.push({ type: 'vertical', position: canvasCenterX, from: 'center', to: 'canvas' });
    }
    if (Math.abs(draggedBounds.centerY - canvasCenterY) < SNAP_THRESHOLD) {
      newGuides.push({ type: 'horizontal', position: canvasCenterY, from: 'middle', to: 'canvas' });
    }

    setGuides(newGuides);
    setDistances(newDistances.slice(0, 2)); // Limit to 2 distances
  }, [draggedElement, elements, selectedElementId, canvasWidth, canvasHeight, scale]);

  if (guides.length === 0 && distances.length === 0) return null;

  return (
    <>
      {/* Guide lines */}
      {guides.map((guide, index) => (
        <Line
          key={`guide-${index}`}
          points={
            guide.type === 'vertical'
              ? [guide.position, 0, guide.position, canvasHeight / scale]
              : [0, guide.position, canvasWidth / scale, guide.position]
          }
          stroke="#FF4444"
          strokeWidth={1 / scale}
          dash={[4 / scale, 4 / scale]}
          opacity={0.8}
        />
      ))}

      {/* Distance labels */}
      {distances.map((dist, index) => (
        <React.Fragment key={`dist-${index}`}>
          <Line
            points={
              dist.isHorizontal
                ? [dist.from, draggedElement!.y + draggedElement!.height / 2, dist.to, draggedElement!.y + draggedElement!.height / 2]
                : [draggedElement!.x + draggedElement!.width / 2, dist.from, draggedElement!.x + draggedElement!.width / 2, dist.to]
            }
            stroke="#FF4444"
            strokeWidth={1 / scale}
            dash={[2 / scale, 2 / scale]}
            opacity={0.6}
          />
          <Text
            x={dist.isHorizontal ? (dist.from + dist.to) / 2 - 15 : draggedElement!.x + draggedElement!.width / 2 + 5}
            y={dist.isHorizontal ? draggedElement!.y + draggedElement!.height / 2 - 15 : (dist.from + dist.to) / 2 - 7}
            text={`${dist.value.toFixed(1)}mm`}
            fontSize={10 / scale}
            fill="#FF4444"
            backgroundColor="#FFFFFF"
            padding={2 / scale}
          />
        </React.Fragment>
      ))}
    </>
  );
};

export default SmartGuides;
