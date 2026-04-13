import { create } from 'zustand';
import { dbService } from '../services/dbService';
import type { Mapping } from '../types';

interface MappingState {
  mappings: Mapping[];
  isLoading: boolean;
}

interface MappingActions {
  loadMappings: () => Promise<void>;
  createMapping: (mapping: Omit<Mapping, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMapping: (id: string, updates: Partial<Mapping>) => Promise<void>;
  deleteMapping: (id: string) => Promise<void>;
  getMappingsByTemplate: (templateId: string) => Mapping[];
}

export const useMappingStore = create<MappingState & MappingActions>()(
  (set, get) => ({
    mappings: [],
    isLoading: false,

    loadMappings: async () => {
      set({ isLoading: true });
      try {
        const mappings = await dbService.getMappings();
        set({ mappings, isLoading: false });
      } catch (error) {
        console.error('Failed to load mappings:', error);
        set({ isLoading: false });
      }
    },

    createMapping: async (mappingData) => {
      try {
        const newMapping = await dbService.createMapping(mappingData);
        set((state) => ({
          mappings: [...state.mappings, newMapping],
        }));
      } catch (error) {
        console.error('Failed to create mapping:', error);
        throw error;
      }
    },

    updateMapping: async (id, updates) => {
      // Note: dbService doesn't have updateMapping yet, using local update for now
      set((state) => ({
        mappings: state.mappings.map((m) =>
          m.id === id
            ? { ...m, ...updates, updatedAt: new Date().toISOString() }
            : m
        ),
      }));
    },

    deleteMapping: async (id) => {
      try {
        await dbService.deleteMapping(id);
        set((state) => ({
          mappings: state.mappings.filter((m) => m.id !== id),
        }));
      } catch (error) {
        console.error('Failed to delete mapping:', error);
        throw error;
      }
    },

    getMappingsByTemplate: (templateId) => {
      return get().mappings.filter((m) => m.templateId === templateId);
    },
  })
);
