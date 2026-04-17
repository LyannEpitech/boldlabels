import { useEffect } from 'react';
import { useEditorStore } from '../stores/editorStore';

interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export const useKeyboardShortcuts = () => {
  const {
    selectedElementId,
    removeElement,
    selectElement,
  } = useEditorStore();

  const shortcuts: ShortcutAction[] = [
    {
      key: 'Delete',
      description: 'Supprimer l\'élément sélectionné',
      action: () => {
        if (selectedElementId) {
          removeElement(selectedElementId);
        }
      }
    },
    {
      key: 'Backspace',
      description: 'Supprimer l\'élément sélectionné',
      action: () => {
        if (selectedElementId) {
          removeElement(selectedElementId);
        }
      }
    },
    {
      key: 'Escape',
      description: 'Désélectionner',
      action: () => selectElement(null)
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const shortcut = shortcuts.find(s => {
        const keyMatch = e.key === s.key || e.code === s.key;
        const ctrlMatch = s.ctrl === undefined || e.ctrlKey === s.ctrl;
        const shiftMatch = s.shift === undefined || e.shiftKey === s.shift;
        const altMatch = s.alt === undefined || e.altKey === s.alt;
        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return { shortcuts };
};

export default useKeyboardShortcuts;
