import { create } from 'zustand';
import { dbService } from '../services/dbService';
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
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

interface EditorActions {
  // Templates
  loadTemplates: () => Promise<void>;
  createTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  loadTemplate: (id: string) => Promise<void>;
  updateTemplate: (updates: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<void>;
  
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
  
  // Error handling
  clearError: () => void;
}

export const useEditorStore = create<EditorState & EditorActions>()(
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
    isLoading: false,
    error: null,
    
    // Actions
    loadTemplates: async () => {
      set({ isLoading: true, error: null });
      try {
        const templates = await dbService.getTemplates();
        set({ templates, isLoading: false });
      } catch (error) {
        console.error('Failed to load templates:', error);
        set({ error: 'Failed to load templates', isLoading: false });
      }
    },
    
    createTemplate: async (templateData) => {
      set({ isLoading: true, error: null });
      try {
        const newTemplate = await dbService.createTemplate(templateData);
        set((state) => ({
          templates: [...state.templates, newTemplate],
          template: newTemplate,
          selectedElementId: null,
          history: [newTemplate],
          historyIndex: 0,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Failed to create template:', error);
        set({ error: 'Failed to create template', isLoading: false });
        throw error;
      }
    },
    
    loadTemplate: async (id) => {
      set({ isLoading: true, error: null });
      try {
        const template = await dbService.getTemplate(id);
        if (template) {
          set({
            template,
            selectedElementId: null,
            history: [template],
            historyIndex: 0,
            isLoading: false,
          });
        } else {
          set({ error: 'Template not found', isLoading: false });
        }
      } catch (error) {
        console.error('Failed to load template:', error);
        set({ error: 'Failed to load template', isLoading: false });
      }
    },
    
    updateTemplate: async (updates) => {
      const { template } = get();
      if (!template) return;
      
      console.log('[Store] updateTemplate called:', Object.keys(updates));
      console.log('[Store] Current elements count:', template.elements?.length);
      
      // Update local state immediately for responsive UI
      const localUpdated: Template = {
        ...template,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      set({
        template: localUpdated,
        templates: get().templates.map((t) =>
          t.id === localUpdated.id ? localUpdated : t
        ),
      });
      
      // Save to backend in background
      try {
        const updated = await dbService.updateTemplate(template.id, updates);
        console.log('[Store] Backend returned elements count:', updated.elements?.length);
        
        get().saveToHistory();
        
        // Merge backend response with local state to preserve elements if backend doesn't return them
        const mergedTemplate: Template = {
          ...localUpdated,
          ...updated,
          // Always keep elements from local state unless explicitly updating them
          elements: updates.elements !== undefined ? updated.elements : localUpdated.elements,
        };
        
        console.log('[Store] Merged elements count:', mergedTemplate.elements?.length);
        
        set({
          template: mergedTemplate,
          templates: get().templates.map((t) =>
            t.id === mergedTemplate.id ? mergedTemplate : t
          ),
        });
      } catch (error) {
        console.error('[Store] Failed to update template:', error);
        // Revert to original on error
        set({ template, error: 'Failed to save changes' });
      }
    },
    
    deleteTemplate: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await dbService.deleteTemplate(id);
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          template: state.template?.id === id ? null : state.template,
          selectedElementId: null,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Failed to delete template:', error);
        set({ error: 'Failed to delete template', isLoading: false });
      }
    },
    
    duplicateTemplate: async (id) => {
      const original = get().templates.find((t) => t.id === id);
      if (!original) return;
      
      set({ isLoading: true, error: null });
      try {
        const duplicate = await dbService.createTemplate({
          ...original,
          name: `${original.name} (copie)`,
          elements: original.elements.map((el) => ({
            ...el,
            id: crypto.randomUUID(),
          })),
        });
        
        set((state) => ({
          templates: [...state.templates, duplicate],
          isLoading: false,
        }));
      } catch (error) {
        console.error('Failed to duplicate template:', error);
        set({ error: 'Failed to duplicate template', isLoading: false });
      }
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
        selectedElementId: newElement.id,
      });
      
      // Auto-save to backend
      dbService.updateTemplate(template.id, { elements: updated.elements })
        .then((result) => {
          console.log('Elements saved:', result.elements?.length || 0, 'elements');
        })
        .catch(console.error);
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
      
      set({ template: updated });
      
      // Auto-save to backend
      dbService.updateTemplate(template.id, { elements: updated.elements }).catch(console.error);
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
        selectedElementId: null,
      });
      
      // Auto-save to backend
      dbService.updateTemplate(template.id, { elements: updated.elements }).catch(console.error);
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
      
      set({ template: updated });
      
      // Auto-save to backend
      dbService.updateTemplate(template.id, { elements: updated.elements }).catch(console.error);
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
    
    clearError: () => set({ error: null }),
  })
);
