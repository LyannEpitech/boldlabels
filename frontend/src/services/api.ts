import type { Template, Mapping } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Templates API
export const templatesApi = {
  list: () => fetchApi<Template[]>('/api/templates'),
  
  get: (id: string) => fetchApi<Template>(`/api/templates/${id}`),
  
  create: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) =>
    fetchApi<Template>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    }),
  
  update: (id: string, template: Partial<Template>) =>
    fetchApi<Template>(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    }),
  
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/templates/${id}`, {
      method: 'DELETE',
    }),
  
  duplicate: (id: string) =>
    fetchApi<Template>(`/api/templates/${id}/duplicate`, {
      method: 'POST',
    }),
};

// Mappings API
export const mappingsApi = {
  list: () => fetchApi<Mapping[]>('/api/mappings'),
  
  get: (id: string) => fetchApi<Mapping>(`/api/mappings/${id}`),
  
  getByTemplate: (templateId: string) =>
    fetchApi<Mapping[]>(`/api/mappings/template/${templateId}`),
  
  create: (mapping: Omit<Mapping, 'id' | 'createdAt' | 'updatedAt'>) =>
    fetchApi<Mapping>('/api/mappings', {
      method: 'POST',
      body: JSON.stringify(mapping),
    }),
  
  update: (id: string, mapping: Partial<Mapping>) =>
    fetchApi<Mapping>(`/api/mappings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapping),
    }),
  
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/mappings/${id}`, {
      method: 'DELETE',
    }),
};
