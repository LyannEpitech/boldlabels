import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Template, TemplateElement } from '../types';

interface EditorState {
  // Template courant
  template: Template | null;
  templates: Template[];
  
  // Sélection
  selectedElementId: string | null;
  
  // Canvas
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  
  // Historique
  history: Template[];
  historyIndex: number;
}

interface EditorActions {
  // Templates
  createTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void;
  loadTemplate: (id: string) => void;
  updateTemplate: (updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;
  
  // Éléments
  addElement: (element: Omit<TemplateElement, 'id' | 'zIndex'>) => void;
  updateElement: (id: string, updates: Partial<TemplateElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  reorderElements: (elementIds: string[]) => void;
  
  // Canvas
  setZoom: (zoom: number) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  
  // Alignment
  alignElements: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeElements: (axis: 'horizontal' | 'vertical') => void;
  
  // Historique
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
}

export const useEditorStore = create<EditorState & EditorActions>()(
  persist(
    (set, get) => ({
      // State initial
      template: null,
      templates: [],
      selectedElementId: null,
      zoom: 1,
      showGrid: true,
      snapToGrid: false,
      gridSize: 5,
      history: [],
      historyIndex: -1,
      
      // Actions
      createTemplate: (templateData) => {
        const now = new Date().toISOString();
        const newTemplate: Template = {
          ...templateData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          templates: [...state.templates, newTemplate],
          template: newTemplate,
          selectedElementId: null,
          history: [newTemplate],
          historyIndex: 0,
        }));
      },
      
      loadTemplate: (id) => {
        const template = get().templates.find((t) => t.id === id);
        if (template) {
          set({
            template,
            selectedElementId: null,
            history: [template],
            historyIndex: 0,
          });
        }
      },
      
      updateTemplate: (updates) => {
        const { template } = get();
        if (!template) return;
        
        const updated: Template = {
          ...template,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        get().saveToHistory();
        
        set({
          template: updated,
          templates: get().templates.map((t) =>
            t.id === updated.id ? updated : t
          ),
        });
      },
      
      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          template: state.template?.id === id ? null : state.template,
          selectedElementId: null,
        }));
      },
      
      duplicateTemplate: (id) => {
        const original = get().templates.find((t) => t.id === id);
        if (!original) return;
        
        const now = new Date().toISOString();
        const duplicate: Template = {
          ...original,
          id: crypto.randomUUID(),
          name: `${original.name} (copie)`,
          createdAt: now,
          updatedAt: now,
          elements: original.elements.map((el) => ({
            ...el,
            id: crypto.randomUUID(),
          })),
        };
        
        set((state) => ({
          templates: [...state.templates, duplicate],
        }));
      },
      
      addElement: (elementData) => {
        const { template } = get();
        if (!template) return;
        
        const newElement: TemplateElement = {
          ...elementData,
          id: crypto.randomUUID(),
          zIndex: template.elements.length,
        };
        
        get().saveToHistory();
        
        const updated: Template = {
          ...template,
          elements: [...template.elements, newElement],
          updatedAt: new Date().toISOString(),
        };
        
        set({
          template: updated,
          templates: get().templates.map((t) =>
            t.id === updated.id ? updated : t
          ),
          selectedElementId: newElement.id,
        });
      },
      
      updateElement: (id, updates) => {
        const { template } = get();
        if (!template) return;
        
        const updated: Template = {
          ...template,
          elements: template.elements.map((el) =>
            el.id === id ? { ...el, ...updates } : el
          ),
          updatedAt: new Date().toISOString(),
        };
        
        set({
          template: updated,
          templates: get().templates.map((t) =>
            t.id === updated.id ? updated : t
          ),
        });
      },
      
      removeElement: (id) => {
        const { template } = get();
        if (!template) return;
        
        get().saveToHistory();
        
        const updated: Template = {
          ...template,
          elements: template.elements.filter((el) => el.id !== id),
          updatedAt: new Date().toISOString(),
        };
        
        set({
          template: updated,
          templates: get().templates.map((t) =>
            t.id === updated.id ? updated : t
          ),
          selectedElementId: null,
        });
      },
      
      selectElement: (id) => set({ selectedElementId: id }),
      
      reorderElements: (elementIds) => {
        const { template } = get();
        if (!template) return;
        
        const reordered = elementIds
          .map((id) => template.elements.find((el) => el.id === id))
          .filter((el): el is TemplateElement => el !== undefined);
        
        const updated: Template = {
          ...template,
          elements: reordered.map((el, i) => ({ ...el, zIndex: i })),
          updatedAt: new Date().toISOString(),
        };
        
        set({
          template: updated,
          templates: get().templates.map((t) =>
            t.id === updated.id ? updated : t
          ),
        });
      },
      
      setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(3, zoom)) }),
      setShowGrid: (show) => set({ showGrid: show }),
      setSnapToGrid: (snap) => set({ snapToGrid: snap }),
      
      alignElements: (alignment) => {
        const { template, selectedElementId } = get();
        if (!template || !selectedElementId) return;
        
        const selectedEl = template.elements.find((el) => el.id === selectedElementId);
        if (!selectedEl) return;
        
        get().saveToHistory();
        
        let updates: Partial<TemplateElement> = {};
        
        switch (alignment) {
          case 'left':
            updates = { x: 0 };
            break;
          case 'center':
            updates = { x: (template.width - selectedEl.width) / 2 };
            break;
          case 'right':
            updates = { x: template.width - selectedEl.width };
            break;
          case 'top':
            updates = { y: 0 };
            break;
          case 'middle':
            updates = { y: (template.height - selectedEl.height) / 2 };
            break;
          case 'bottom':
            updates = { y: template.height - selectedEl.height };
            break;
        }
        
        get().updateElement(selectedElementId, updates);
      },
      
      distributeElements: (axis) => {
        // TODO: Implement multi-selection distribution
        console.log('Distribute', axis);
      },
      
      saveToHistory: () => {
        const { template, history, historyIndex } = get();
        if (!template) return;
        
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(template);
        
        set({
          history: newHistory.slice(-50),
          historyIndex: newHistory.length - 1,
        });
      },
      
      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          set({
            template: history[newIndex],
            historyIndex: newIndex,
            selectedElementId: null,
          });
        }
      },
      
      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          set({
            template: history[newIndex],
            historyIndex: newIndex,
            selectedElementId: null,
          });
        }
      },
    }),
    {
      name: 'boldlabels-storage',
      partialize: (state) => ({
        templates: state.templates,
        zoom: state.zoom,
        showGrid: state.showGrid,
        snapToGrid: state.snapToGrid,
        gridSize: state.gridSize,
      }),
    }
  )
);
