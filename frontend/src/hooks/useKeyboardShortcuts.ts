import { useEffect, useCallback } from 'react';
import { useEditorStore } from '../stores/editorStore';

interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: (e?: KeyboardEvent) => void;
}

export const useKeyboardShortcuts = () => {
  const {
    selectedElementId,
    selectedElementIds,
    copiedElements,
    removeElement,
    removeMultipleElements,
    selectElement,
    clearSelection,
    copyElements,
    pasteElements,
    duplicateElement,
    duplicateMultipleElements,
    groupElements,
    ungroupElements,
    updateElement,
    undo,
    redo,
    history,
    historyIndex,
    template,
  } = useEditorStore();
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const moveSelectedElements = useCallback((dx: number, dy: number) => {
    const ids = selectedElementIds.length > 0 ? selectedElementIds : 
                selectedElementId ? [selectedElementId] : [];
    
    if (ids.length === 0 || !template) return;
    
    ids.forEach(id => {
      const element = template.elements.find(el => el.id === id);
      if (element) {
        updateElement(id, { x: element.x + dx, y: element.y + dy });
      }
    });
  }, [selectedElementIds, selectedElementId, template, updateElement]);

  const shortcuts: ShortcutAction[] = [
    // Suppression
    {
      key: 'Delete',
      description: 'Supprimer l\'élément sélectionné',
      action: () => {
        if (selectedElementIds.length > 1) {
          removeMultipleElements(selectedElementIds);
        } else if (selectedElementId) {
          removeElement(selectedElementId);
        }
      }
    },
    {
      key: 'Backspace',
      description: 'Supprimer l\'élément sélectionné',
      action: () => {
        if (selectedElementIds.length > 1) {
          removeMultipleElements(selectedElementIds);
        } else if (selectedElementId) {
          removeElement(selectedElementId);
        }
      }
    },
    
    // Sélection
    {
      key: 'Escape',
      description: 'Désélectionner tout',
      action: () => clearSelection()
    },
    {
      key: 'a',
      ctrl: true,
      description: 'Sélectionner tout',
      action: () => {
        if (template) {
          const allIds = template.elements.map(el => el.id);
          selectElement(allIds[allIds.length - 1] || null);
        }
      }
    },
    
    // Copier / Coller / Dupliquer
    {
      key: 'c',
      ctrl: true,
      description: 'Copier',
      action: () => {
        const ids = selectedElementIds.length > 0 ? selectedElementIds : 
                    selectedElementId ? [selectedElementId] : [];
        if (ids.length > 0) {
          copyElements(ids);
        }
      }
    },
    {
      key: 'v',
      ctrl: true,
      description: 'Coller',
      action: () => {
        if (copiedElements.length > 0) {
          pasteElements();
        }
      }
    },
    {
      key: 'd',
      ctrl: true,
      description: 'Dupliquer',
      action: () => {
        if (selectedElementIds.length > 1) {
          duplicateMultipleElements(selectedElementIds);
        } else if (selectedElementId) {
          duplicateElement(selectedElementId);
        }
      }
    },
    
    // Groupement
    {
      key: 'g',
      ctrl: true,
      shift: false,
      description: 'Grouper les éléments',
      action: () => {
        if (selectedElementIds.length >= 2) {
          groupElements(selectedElementIds);
        }
      }
    },
    {
      key: 'g',
      ctrl: true,
      shift: true,
      description: 'Dégrouper',
      action: () => {
        if (selectedElementId && template) {
          const element = template.elements.find(el => el.id === selectedElementId);
          if (element?.groupId) {
            ungroupElements(element.groupId);
          }
        }
      }
    },
    
    // Undo / Redo
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
    
    // Déplacement avec flèches
    {
      key: 'ArrowUp',
      description: 'Déplacer vers le haut (1mm)',
      action: () => moveSelectedElements(0, -1)
    },
    {
      key: 'ArrowDown',
      description: 'Déplacer vers le bas (1mm)',
      action: () => moveSelectedElements(0, 1)
    },
    {
      key: 'ArrowLeft',
      description: 'Déplacer vers la gauche (1mm)',
      action: () => moveSelectedElements(-1, 0)
    },
    {
      key: 'ArrowRight',
      description: 'Déplacer vers la droite (1mm)',
      action: () => moveSelectedElements(1, 0)
    },
    {
      key: 'ArrowUp',
      shift: true,
      description: 'Déplacer vers le haut (0.1mm)',
      action: () => moveSelectedElements(0, -0.1)
    },
    {
      key: 'ArrowDown',
      shift: true,
      description: 'Déplacer vers le bas (0.1mm)',
      action: () => moveSelectedElements(0, 0.1)
    },
    {
      key: 'ArrowLeft',
      shift: true,
      description: 'Déplacer vers la gauche (0.1mm)',
      action: () => moveSelectedElements(-0.1, 0)
    },
    {
      key: 'ArrowRight',
      shift: true,
      description: 'Déplacer vers la droite (0.1mm)',
      action: () => moveSelectedElements(0.1, 0)
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const shortcut = shortcuts.find(s => {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
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
