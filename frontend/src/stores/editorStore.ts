import { create } from 'zustand';
import { dbService } from '../services/dbService';
import type { Template, TemplateElement } from '../types';

interface EditorState {
  // Template courant
  template: Template | null;
  templates: Template[];
  
  // Sélection (multi-sélection support)
  selectedElementId: string | null;
  selectedElementIds: string[];
  
  // Rubber band selection
  selectionBox: { x: number; y: number; width: number; height: number } | null;
  isSelecting: boolean;
  
  // Custom guides
  guides: { position: number; orientation: 'horizontal' | 'vertical' }[];
  
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
  updateMultipleElements: (ids: string[], updates: Partial<TemplateElement>) => void;
  removeElement: (id: string) => void;
  removeMultipleElements: (ids: string[]) => void;
  selectElement: (id: string | null) => void;
  toggleElementSelection: (id: string) => void;
  selectMultipleElements: (ids: string[]) => void;
  clearSelection: () => void;
  reorderElements: (elementIds: string[]) => void;
  
  // Rubber band selection
  startSelectionBox: (x: number, y: number) => void;
  updateSelectionBox: (width: number, height: number) => void;
  endSelectionBox: () => string[];
  
  // Guides
  addGuide: (guide: { position: number; orientation: 'horizontal' | 'vertical' }) => void;
  removeGuide: (index: number) => void;
  clearGuides: () => void;
  
  // Copy/Paste
  copiedElements: TemplateElement[];
  copyElements: (ids: string[]) => void;
  pasteElements: () => void;
  duplicateElement: (id: string) => void;
  duplicateMultipleElements: (ids: string[]) => void;
  
  // Canvas
  setZoom: (zoom: number) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  
  // Alignment
  alignElements: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeElements: (axis: 'horizontal' | 'vertical') => void;
  
  // Grouping
  groupElements: (ids: string[]) => string;
  ungroupElements: (groupId: string) => void;
  
  // Import/Export
  exportTemplate: () => string;
  importTemplate: (json: string) => void;
  
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
    selectedElementIds: [],
    selectionBox: null,
    isSelecting: false,
    guides: [],
    copiedElements: [],
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
    
    updateElement: async (id, updates) => {
      const { template } = get();
      if (!template) return;

      console.log('[Store] updateElement called:', id, Object.keys(updates));

      // Optimistic update
      const element = template.elements.find((el) => el.id === id);
      if (!element) return;

      const updatedElement = { ...element, ...updates };
      const updated: Template = {
        ...template,
        elements: template.elements.map((el) =>
          el.id === id ? updatedElement : el
        ),
        updatedAt: new Date().toISOString(),
      };

      set({ template: updated });

      // Auto-save to backend using PATCH for single element (preserves ID)
      try {
        await dbService.updateElement(template.id, id, updates);
        console.log('[Store] updateElement saved via PATCH');
      } catch (error) {
        console.error('[Store] Failed to save element update:', error);
        // Revert on error
        set({ template });
      }
    },
    
    removeElement: async (id) => {
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
      try {
        await dbService.updateTemplate(template.id, { elements: updated.elements });
        console.log('[Store] removeElement saved');
      } catch (error) {
        console.error('[Store] Failed to save element removal:', error);
        set({ template });
      }
    },
    
    selectElement: (id) => set({ selectedElementId: id, selectedElementIds: id ? [id] : [] }),
    
    toggleElementSelection: (id) => {
      const { selectedElementIds } = get();
      const index = selectedElementIds.indexOf(id);
      let newSelection: string[];
      
      if (index === -1) {
        newSelection = [...selectedElementIds, id];
      } else {
        newSelection = selectedElementIds.filter((_, i) => i !== index);
      }
      
      set({
        selectedElementIds: newSelection,
        selectedElementId: newSelection.length > 0 ? newSelection[newSelection.length - 1] : null,
      });
    },
    
    selectMultipleElements: (ids) => set({
      selectedElementIds: ids,
      selectedElementId: ids.length > 0 ? ids[ids.length - 1] : null,
    }),
    
    clearSelection: () => set({ selectedElementId: null, selectedElementIds: [] }),
    
    updateMultipleElements: async (ids, updates) => {
      const { template } = get();
      if (!template) return;
      
      const updated: Template = {
        ...template,
        elements: template.elements.map((el) =>
          ids.includes(el.id) ? { ...el, ...updates } : el
        ),
        updatedAt: new Date().toISOString(),
      };
      
      set({ template: updated });
      
      try {
        await dbService.updateTemplate(template.id, { elements: updated.elements });
      } catch (error) {
        console.error('[Store] Failed to save multiple element updates:', error);
        set({ template });
      }
    },
    
    removeMultipleElements: async (ids) => {
      const { template } = get();
      if (!template) return;
      
      get().saveToHistory();
      
      const updated: Template = {
        ...template,
        elements: template.elements.filter((el) => !ids.includes(el.id)),
        updatedAt: new Date().toISOString(),
      };
      
      set({
        template: updated,
        selectedElementId: null,
        selectedElementIds: [],
      });
      
      try {
        await dbService.updateTemplate(template.id, { elements: updated.elements });
      } catch (error) {
        console.error('[Store] Failed to save element removal:', error);
        set({ template });
      }
    },
    
    // Rubber band selection
    startSelectionBox: (x, y) => set({
      selectionBox: { x, y, width: 0, height: 0 },
      isSelecting: true,
    }),
    
    updateSelectionBox: (width, height) => set((state) => ({
      selectionBox: state.selectionBox ? { ...state.selectionBox, width, height } : null,
    })),
    
    endSelectionBox: () => {
      const { selectionBox, template } = get();
      if (!selectionBox || !template) {
        set({ selectionBox: null, isSelecting: false });
        return [];
      }
      
      // Convert mm to px for comparison with selection box (which is in px)
      const MM_TO_PX = 3.7795275591;
      
      const selectedIds = template.elements.filter((el) => {
        const elLeft = el.x * MM_TO_PX;
        const elTop = el.y * MM_TO_PX;
        const elRight = elLeft + el.width * MM_TO_PX;
        const elBottom = elTop + el.height * MM_TO_PX;
        const boxRight = selectionBox.x + selectionBox.width;
        const boxBottom = selectionBox.y + selectionBox.height;
        
        return (
          elLeft < boxRight &&
          elRight > selectionBox.x &&
          elTop < boxBottom &&
          elBottom > selectionBox.y
        );
      }).map((el) => el.id);
      
      set({
        selectionBox: null,
        isSelecting: false,
        selectedElementIds: selectedIds,
        selectedElementId: selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null,
      });
      
      return selectedIds;
    },
    
    // Guides
    addGuide: (guide) => set((state) => ({
      guides: [...state.guides, guide],
    })),
    
    removeGuide: (index) => set((state) => ({
      guides: state.guides.filter((_, i) => i !== index),
    })),
    
    clearGuides: () => set({ guides: [] }),
    
    // Copy/Paste
    copyElements: (ids) => {
      const { template } = get();
      if (!template) return;
      
      const elementsToCopy = template.elements.filter((el) => ids.includes(el.id));
      set({ copiedElements: elementsToCopy });
    },
    
    pasteElements: () => {
      const { template, copiedElements } = get();
      if (!template || copiedElements.length === 0) return;
      
      get().saveToHistory();
      
      const newElements: TemplateElement[] = copiedElements.map((el) => ({
        ...el,
        id: crypto.randomUUID(),
        x: el.x + 5,
        y: el.y + 5,
      }));
      
      const updated: Template = {
        ...template,
        elements: [...template.elements, ...newElements],
        updatedAt: new Date().toISOString(),
      };
      
      set({
        template: updated,
        selectedElementIds: newElements.map((el) => el.id),
        selectedElementId: newElements[newElements.length - 1].id,
      });
      
      dbService.updateTemplate(template.id, { elements: updated.elements })
        .catch(console.error);
    },
    
    duplicateElement: (id) => {
      const { template } = get();
      if (!template) return;
      
      const element = template.elements.find((el) => el.id === id);
      if (!element) return;
      
      get().saveToHistory();
      
      const newElement: TemplateElement = {
        ...element,
        id: crypto.randomUUID(),
        x: element.x + 5,
        y: element.y + 5,
        zIndex: template.elements.length,
      };
      
      const updated: Template = {
        ...template,
        elements: [...template.elements, newElement],
        updatedAt: new Date().toISOString(),
      };
      
      set({
        template: updated,
        selectedElementId: newElement.id,
        selectedElementIds: [newElement.id],
      });
      
      dbService.updateTemplate(template.id, { elements: updated.elements })
        .catch(console.error);
    },
    
    duplicateMultipleElements: (ids) => {
      const { template } = get();
      if (!template) return;
      
      get().saveToHistory();
      
      const elementsToDuplicate = template.elements.filter((el) => ids.includes(el.id));
      const newElements: TemplateElement[] = elementsToDuplicate.map((el) => ({
        ...el,
        id: crypto.randomUUID(),
        x: el.x + 5,
        y: el.y + 5,
        zIndex: template.elements.length,
      }));
      
      const updated: Template = {
        ...template,
        elements: [...template.elements, ...newElements],
        updatedAt: new Date().toISOString(),
      };
      
      set({
        template: updated,
        selectedElementIds: newElements.map((el) => el.id),
        selectedElementId: newElements[newElements.length - 1].id,
      });
      
      dbService.updateTemplate(template.id, { elements: updated.elements })
        .catch(console.error);
    },
    
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
    
    groupElements: (ids) => {
      const { template } = get();
      if (!template || ids.length < 2) return '';
      
      get().saveToHistory();
      
      const groupId = crypto.randomUUID();
      
      const updatedElements = template.elements.map((el) =>
        ids.includes(el.id) ? { ...el, groupId } : el
      );
      
      const updated: Template = {
        ...template,
        elements: updatedElements,
        updatedAt: new Date().toISOString(),
      };
      
      set({ template: updated });
      
      dbService.updateTemplate(template.id, { elements: updated.elements })
        .catch(console.error);
      
      return groupId;
    },
    
    ungroupElements: (groupId) => {
      const { template } = get();
      if (!template) return;
      
      get().saveToHistory();
      
      const updatedElements = template.elements.map((el) =>
        el.groupId === groupId ? { ...el, groupId: undefined } : el
      );
      
      const updated: Template = {
        ...template,
        elements: updatedElements,
        updatedAt: new Date().toISOString(),
      };
      
      set({ template: updated });
      
      dbService.updateTemplate(template.id, { elements: updated.elements })
        .catch(console.error);
    },
    
    exportTemplate: () => {
      const { template } = get();
      if (!template) return '';
      
      const exportData = {
        ...template,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };
      
      return JSON.stringify(exportData, null, 2);
    },
    
    importTemplate: (json) => {
      try {
        const parsed = JSON.parse(json);
        
        // Validation basique
        if (!parsed.name || !parsed.width || !parsed.height) {
          throw new Error('Invalid template format');
        }
        
        get().createTemplate({
          name: `${parsed.name} (importé)`,
          width: parsed.width,
          height: parsed.height,
          unit: parsed.unit || 'mm',
          backgroundColor: parsed.backgroundColor || '#FFFFFF',
          borderWidth: parsed.borderWidth || 0,
          borderColor: parsed.borderColor || '#000000',
          borderRadius: parsed.borderRadius || 0,
          description: parsed.description || '',
          elements: (parsed.elements || []).map((el: any) => ({
            ...el,
            id: crypto.randomUUID(), // Nouveaux IDs
          })),
        });
      } catch (error) {
        console.error('Failed to import template:', error);
        set({ error: 'Failed to import template' });
      }
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
