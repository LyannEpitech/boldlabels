import React from 'react';
import { Rect } from 'react-konva';

interface SelectionBoxProps {
  isSelecting: boolean;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  scale: number;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  isSelecting,
  startPos,
  currentPos,
  scale,
}) => {
  if (!isSelecting) return null;

  // Calculate box dimensions for rendering
  const boxX = Math.min(startPos.x, currentPos.x);
  const boxY = Math.min(startPos.y, currentPos.y);
  const boxWidth = Math.abs(currentPos.x - startPos.x);
  const boxHeight = Math.abs(currentPos.y - startPos.y);

  if (boxWidth < 5 || boxHeight < 5) return null;

  return (
    <Rect
      x={boxX}
      y={boxY}
      width={boxWidth}
      height={boxHeight}
      fill="rgba(99, 102, 241, 0.1)"
      stroke="#6366F1"
      strokeWidth={1 / scale}
      dash={[4 / scale, 4 / scale]}
      listening={false}
    />
  );
};

export default SelectionBox;
