import React, { useState, useCallback } from 'react';
import { Stage, Layer, Text, Rect } from 'react-konva';


interface RulerProps {
  width: number;
  height: number;
  scale: number;
  onGuideAdd?: (guide: { position: number; orientation: 'horizontal' | 'vertical' }) => void;
  children?: React.ReactNode;
}

const RULER_SIZE = 30; // pixels
const MM_TO_PX = 3.7795275591;

export const Ruler: React.FC<RulerProps> = ({
  width,
  height,
  scale,
  onGuideAdd,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOrientation, setDragOrientation] = useState<'horizontal' | 'vertical' | null>(null);
  const [dragPosition, setDragPosition] = useState(0);

  const handleRulerMouseDown = useCallback((e: React.MouseEvent, orientation: 'horizontal' | 'vertical') => {
    setIsDragging(true);
    setDragOrientation(orientation);
    
    if (orientation === 'horizontal') {
      setDragPosition(e.clientY);
    } else {
      setDragPosition(e.clientX);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    if (dragOrientation === 'horizontal') {
      setDragPosition(e.clientY);
    } else {
      setDragPosition(e.clientX);
    }
  }, [isDragging, dragOrientation]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragOrientation) {
      // Calculate position relative to canvas
      const canvasRect = document.getElementById('canvas-wrapper')?.getBoundingClientRect();
      if (canvasRect) {
        const positionPx = dragOrientation === 'horizontal' 
          ? dragPosition - canvasRect.top 
          : dragPosition - canvasRect.left;
        
        const positionMm = Math.round((positionPx / scale / MM_TO_PX) * 10) / 10;
        
        // Only add guide if within canvas bounds
        if (positionMm > 0 && positionMm < (dragOrientation === 'horizontal' ? height : width)) {
          onGuideAdd?.({ position: positionMm, orientation: dragOrientation });
        }
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

  const canvasWidth = width * MM_TO_PX * scale;
  const canvasHeight = height * MM_TO_PX * scale;

  return (
    <div style={{ position: 'relative', width: RULER_SIZE + canvasWidth, height: RULER_SIZE + canvasHeight }}>
      {/* Horizontal Ruler */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: RULER_SIZE,
          width: canvasWidth,
          height: RULER_SIZE,
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          cursor: 'crosshair',
        }}
        onMouseDown={(e) => handleRulerMouseDown(e, 'horizontal')}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Stage width={canvasWidth} height={RULER_SIZE}>
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
          height: canvasHeight,
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid #ddd',
          cursor: 'crosshair',
        }}
        onMouseDown={(e) => handleRulerMouseDown(e, 'vertical')}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Stage width={RULER_SIZE} height={canvasHeight}>
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

      {/* Canvas Container */}
      <div
        id="canvas-wrapper"
        style={{
          position: 'absolute',
          top: RULER_SIZE,
          left: RULER_SIZE,
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        {children}
      </div>

      {/* Dragging Guide Line */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            top: dragOrientation === 'horizontal' ? dragPosition : RULER_SIZE,
            left: dragOrientation === 'vertical' ? dragPosition : RULER_SIZE,
            width: dragOrientation === 'horizontal' ? canvasWidth : 1,
            height: dragOrientation === 'vertical' ? canvasHeight : 1,
            backgroundColor: '#6366F1',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        />
      )}
    </div>
  );
};

export default Ruler;
