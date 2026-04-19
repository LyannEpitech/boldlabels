import React, { useState, useCallback } from 'react';
import { Stage, Layer, Text, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

interface RulerProps {
  width: number;
  height: number;
  scale: number;
  onGuideAdd?: (guide: { position: number; orientation: 'horizontal' | 'vertical' }) => void;
  // TODO: Implement guide removal and display
  // onGuideRemove?: (index: number) => void;
  // guides?: { position: number; orientation: 'horizontal' | 'vertical' }[];
}

const RULER_SIZE = 30; // pixels
const MM_TO_PX = 3.7795275591;

export const Ruler: React.FC<RulerProps> = ({
  width,
  height,
  scale,
  onGuideAdd,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOrientation, setDragOrientation] = useState<'horizontal' | 'vertical' | null>(null);
  const [dragPosition, setDragPosition] = useState(0);

  const handleRulerMouseDown = useCallback((e: KonvaEventObject<MouseEvent>, orientation: 'horizontal' | 'vertical') => {
    setIsDragging(true);
    setDragOrientation(orientation);
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    if (orientation === 'horizontal') {
      setDragPosition(pos.y);
    } else {
      setDragPosition(pos.x);
    }
  }, []);

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isDragging) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    if (dragOrientation === 'horizontal') {
      setDragPosition(pos.y - RULER_SIZE);
    } else {
      setDragPosition(pos.x - RULER_SIZE);
    }
  }, [isDragging, dragOrientation]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragOrientation) {
      // Convert position to mm
      const positionMm = Math.round((dragPosition / scale / MM_TO_PX) * 10) / 10;
      
      // Only add guide if within canvas bounds
      if (positionMm > 0 && positionMm < (dragOrientation === 'horizontal' ? height : width)) {
        onGuideAdd?.({ position: positionMm, orientation: dragOrientation });
      }
    }
    
    setIsDragging(false);
    setDragOrientation(null);
  }, [isDragging, dragOrientation, dragPosition, scale, width, height, onGuideAdd]);

  // Generate ruler marks
  const generateMarks = (_size: number, isHorizontal: boolean) => {
    const marks: { x: number; y: number; width: number; height: number; label?: string }[] = [];
    const totalMm = isHorizontal ? width : height;
    
    for (let mm = 0; mm <= totalMm; mm += 1) {
      const isMajor = mm % 10 === 0;
      const isMedium = mm % 5 === 0;
      const markLength = isMajor ? 15 : isMedium ? 10 : 5;
      const pos = mm * MM_TO_PX * scale;
      
      if (isHorizontal) {
        marks.push({
          x: RULER_SIZE + pos,
          y: RULER_SIZE - markLength,
          width: 1,
          height: markLength,
          label: isMajor ? `${mm}` : undefined,
        });
      } else {
        marks.push({
          x: RULER_SIZE - markLength,
          y: RULER_SIZE + pos,
          width: markLength,
          height: 1,
          label: isMajor ? `${mm}` : undefined,
        });
      }
    }
    
    return marks;
  };

  const horizontalMarks = generateMarks(width, true);
  const verticalMarks = generateMarks(height, false);

  return (
    <div style={{ position: 'relative' }}>
      {/* Horizontal Ruler */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: RULER_SIZE,
          width: width * MM_TO_PX * scale,
          height: RULER_SIZE,
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          cursor: 'crosshair',
        }}
        onMouseDown={(e) => handleRulerMouseDown(e as any, 'horizontal')}
        onMouseMove={(e) => handleMouseMove(e as any)}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Stage
          width={width * MM_TO_PX * scale}
          height={RULER_SIZE}
        >
          <Layer>
            {horizontalMarks.map((mark, i) => (
              <React.Fragment key={i}>
                <Rect
                  x={mark.x - RULER_SIZE}
                  y={mark.y}
                  width={mark.width}
                  height={mark.height}
                  fill="#666"
                />
                {mark.label && (
                  <Text
                    x={mark.x - RULER_SIZE - 5}
                    y={5}
                    text={mark.label}
                    fontSize={9}
                    fill="#666"
                  />
                )}
              </React.Fragment>
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Vertical Ruler */}
      <div
        style={{
          position: 'absolute',
          top: RULER_SIZE,
          left: 0,
          width: RULER_SIZE,
          height: height * MM_TO_PX * scale,
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid #ddd',
          cursor: 'crosshair',
        }}
        onMouseDown={(e) => handleRulerMouseDown(e as any, 'vertical')}
        onMouseMove={(e) => handleMouseMove(e as any)}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Stage
          width={RULER_SIZE}
          height={height * MM_TO_PX * scale}
        >
          <Layer>
            {verticalMarks.map((mark, i) => (
              <React.Fragment key={i}>
                <Rect
                  x={mark.x}
                  y={mark.y - RULER_SIZE}
                  width={mark.width}
                  height={mark.height}
                  fill="#666"
                />
                {mark.label && (
                  <Text
                    x={5}
                    y={mark.y - RULER_SIZE - 5}
                    text={mark.label}
                    fontSize={9}
                    fill="#666"
                    rotation={-90}
                  />
                )}
              </React.Fragment>
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Corner */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: RULER_SIZE,
          height: RULER_SIZE,
          backgroundColor: '#e8e8e8',
          borderRight: '1px solid #ddd',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: '#666',
        }}
      >
        mm
      </div>

      {/* Dragging Guide Line */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            top: dragOrientation === 'horizontal' ? dragPosition + RULER_SIZE : RULER_SIZE,
            left: dragOrientation === 'vertical' ? dragPosition + RULER_SIZE : RULER_SIZE,
            width: dragOrientation === 'horizontal' ? width * MM_TO_PX * scale : 1,
            height: dragOrientation === 'vertical' ? height * MM_TO_PX * scale : 1,
            backgroundColor: '#00a8ff',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        />
      )}
    </div>
  );
};

export default Ruler;
