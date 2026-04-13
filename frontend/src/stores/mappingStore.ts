import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Mapping } from '../types';

interface MappingState {
  mappings: Mapping[];
}

interface MappingActions {
  createMapping: (mapping: Omit<Mapping, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMapping: (id: string, updates: Partial<Mapping>) => void;
  deleteMapping: (id: string) => void;
  getMappingsByTemplate: (templateId: string) => Mapping[];
}

export const useMappingStore = create<MappingState & MappingActions>()(
  persist(
    (set, get) => ({
      mappings: [],

      createMapping: (mappingData) => {
        const now = new Date().toISOString();
        const newMapping: Mapping = {
          ...mappingData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          mappings: [...state.mappings, newMapping],
        }));
      },

      updateMapping: (id, updates) => {
        set((state) => ({
          mappings: state.mappings.map((m) =>
            m.id === id
              ? { ...m, ...updates, updatedAt: new Date().toISOString() }
              : m
          ),
        }));
      },

      deleteMapping: (id) => {
        set((state) => ({
          mappings: state.mappings.filter((m) => m.id !== id),
        }));
      },

      getMappingsByTemplate: (templateId) => {
        return get().mappings.filter((m) => m.templateId === templateId);
      },
    }),
    {
      name: 'boldlabels-mappings',
    }
  )
);
