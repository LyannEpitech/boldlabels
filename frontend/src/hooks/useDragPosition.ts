import { useState, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface DragPositionState {
  position: Position | null;
  isVisible: boolean;
}

export function useDragPosition() {
  const [state, setState] = useState<DragPositionState>({
    position: null,
    isVisible: false,
  });

  const showPosition = useCallback((x: number, y: number) => {
    setState({
      position: { x, y },
      isVisible: true,
    });
  }, []);

  const hidePosition = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  const updatePosition = useCallback((x: number, y: number) => {
    setState({
      position: { x, y },
      isVisible: true,
    });
  }, []);

  return {
    position: state.position,
    isVisible: state.isVisible,
    showPosition,
    hidePosition,
    updatePosition,
  };
}

export default useDragPosition;
