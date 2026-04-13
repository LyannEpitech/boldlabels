import { create } from 'zustand';
import { dbService } from '../services/dbService';
import type { Mapping } from '../types';

interface MappingState {
  mappings: Mapping[];
  isLoading: boolean;
  error: string | null;
}

interface MappingActions {
  loadMappings: () => Promise<void>;
  loadMappingsByTemplate: (templateId: string) => Promise<void>;
  createMapping: (mapping: Omit<Mapping, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMapping: (id: string, updates: Partial<Mapping>) => Promise<void>;
  deleteMapping: (id: string) => Promise<void>;
  getMappingsByTemplate: (templateId: string) => Mapping[];
  clearError: () => void;
}

export const useMappingStore = create<MappingState & MappingActions>()(
  (set, get) => ({
    mappings: [],
    isLoading: false,
    error: null,

    loadMappings: async () => {
      set({ isLoading: true, error: null });
      try {
        const mappings = await dbService.getMappings();
        set({ mappings, isLoading: false });
      } catch (error) {
        console.error('Failed to load mappings:', error);
        set({ error: 'Failed to load mappings', isLoading: false });
      }
    },

    loadMappingsByTemplate: async (templateId: string) => {
      set({ isLoading: true, error: null });
      try {
        const mappings = await dbService.getMappingsByTemplate(templateId);
        set({ mappings, isLoading: false });
      } catch (error) {
        console.error('Failed to load mappings:', error);
        set({ error: 'Failed to load mappings', isLoading: false });
      }
    },

    createMapping: async (mappingData) => {
      set({ isLoading: true, error: null });
      try {
        const newMapping = await dbService.createMapping(mappingData);
        set((state) => ({
          mappings: [...state.mappings, newMapping],
          isLoading: false,
        }));
      } catch (error) {
        console.error('Failed to create mapping:', error);
        set({ error: 'Failed to create mapping', isLoading: false });
        throw error;
      }
    },

    updateMapping: async (id, updates) => {
      set({ isLoading: true, error: null });
      try {
        const updated = await dbService.updateMapping?.(id, updates);
        if (updated) {
          set((state) => ({
            mappings: state.mappings.map((m) =>
              m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
            ),
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Failed to update mapping:', error);
        set({ error: 'Failed to update mapping', isLoading: false });
      }
    },

    deleteMapping: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await dbService.deleteMapping(id);
        set((state) => ({
          mappings: state.mappings.filter((m) => m.id !== id),
          isLoading: false,
        }));
      } catch (error) {
        console.error('Failed to delete mapping:', error);
        set({ error: 'Failed to delete mapping', isLoading: false });
      }
    },

    getMappingsByTemplate: (templateId) => {
      return get().mappings.filter((m) => m.templateId === templateId);
    },

    clearError: () => set({ error: null }),
  })
);
