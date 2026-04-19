import React from 'react';

interface PositionIndicatorProps {
  x: number;
  y: number;
  visible: boolean;
}

export const PositionIndicator: React.FC<PositionIndicatorProps> = ({
  x,
  y,
  visible,
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'translate(12px, -24px)',
        left: x,
        top: y,
      }}
    >
      <div
        style={{
          backgroundColor: '#00a8ff',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap',
        }}
      >
        X: {x.toFixed(1)}mm | Y: {y.toFixed(1)}mm
      </div>
    </div>
  );
};

interface DistanceIndicatorProps {
  distance: number;
  x: number;
  y: number;
  orientation: 'horizontal' | 'vertical';
  visible: boolean;
}

export const DistanceIndicator: React.FC<DistanceIndicatorProps> = ({
  distance,
  x,
  y,
  orientation,
  visible,
}) => {
  if (!visible || distance <= 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    >
      <div
        style={{
          backgroundColor: '#ff6b6b',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '10px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          transform: orientation === 'horizontal' ? 'translateY(-50%)' : 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {distance.toFixed(1)}mm
      </div>
    </div>
  );
};

export default PositionIndicator;
