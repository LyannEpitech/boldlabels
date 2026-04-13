import { useEditorStore } from '../stores/editorStore';

export function useSnapToGrid() {
  const { snapToGrid, gridSize } = useEditorStore();

  const snap = (value: number): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  return { snap, snapToGrid, gridSize };
}
