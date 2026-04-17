import { useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';

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
    elements,
    updateElement,
    removeElement,
    duplicateElement,
    saveTemplate,
    undo,
    redo,
    canUndo,
    canRedo,
    setSelectedElementId
  } = useEditorStore();

  const moveElement = useCallback((dx: number, dy: number) => {
    if (!selectedElementId) return;
    const element = elements.find(e => e.id === selectedElementId);
    if (!element) return;
    
    updateElement(selectedElementId, {
      x: element.x + dx,
      y: element.y + dy
    });
  }, [selectedElementId, elements, updateElement]);

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
      key: 'z',
      ctrl: true,
      description: 'Annuler',
      action: () => {
        if (canUndo) undo();
      }
    },
    {
      key: 'y',
      ctrl: true,
      description: 'Rétablir',
      action: () => {
        if (canRedo) redo();
      }
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      description: 'Rétablir',
      action: () => {
        if (canRedo) redo();
      }
    },
    {
      key: 'd',
      ctrl: true,
      description: 'Dupliquer l\'élément',
      action: () => {
        if (selectedElementId) {
          duplicateElement(selectedElementId);
        }
      }
    },
    {
      key: 's',
      ctrl: true,
      description: 'Sauvegarder',
      action: (e?: Event) => {
        e?.preventDefault();
        saveTemplate();
      }
    },
    {
      key: 'ArrowUp',
      description: 'Déplacer vers le haut (1mm)',
      action: () => moveElement(0, -1)
    },
    {
      key: 'ArrowDown',
      description: 'Déplacer vers le bas (1mm)',
      action: () => moveElement(0, 1)
    },
    {
      key: 'ArrowLeft',
      description: 'Déplacer vers la gauche (1mm)',
      action: () => moveElement(-1, 0)
    },
    {
      key: 'ArrowRight',
      description: 'Déplacer vers la droite (1mm)',
      action: () => moveElement(1, 0)
    },
    {
      key: 'ArrowUp',
      shift: true,
      description: 'Déplacer vers le haut (0.1mm)',
      action: () => moveElement(0, -0.1)
    },
    {
      key: 'ArrowDown',
      shift: true,
      description: 'Déplacer vers le bas (0.1mm)',
      action: () => moveElement(0, 0.1)
    },
    {
      key: 'ArrowLeft',
      shift: true,
      description: 'Déplacer vers la gauche (0.1mm)',
      action: () => moveElement(-0.1, 0)
    },
    {
      key: 'ArrowRight',
      shift: true,
      description: 'Déplacer vers la droite (0.1mm)',
      action: () => moveElement(0.1, 0)
    },
    {
      key: 'Escape',
      description: 'Désélectionner',
      action: () => setSelectedElementId(null)
    },
    {
      key: 'a',
      ctrl: true,
      description: 'Sélectionner tout',
      action: () => {
        if (elements.length > 0) {
          setSelectedElementId(elements[0].id);
        }
      }
    }
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
        shortcut.action(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return { shortcuts };
};

export default useKeyboardShortcuts;
