import type { Template, Mapping } from '../types';
import { useToastStore } from '../stores/toastStore';
import { parseBackendError } from '../utils/errorHandler';

// Détecter si on est dans Electron
const isElectron = () => {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
};

// API Electron
const electronAPI = isElectron() ? (window as any).electronAPI : null;

// Helper to handle errors with toast notifications
async function handleResponse(res: Response, context: string): Promise<any> {
  if (!res.ok) {
    let errorData: any;
    try {
      errorData = await res.json();
    } catch {
      errorData = { message: res.statusText };
    }

    const error = {
      response: {
        status: res.status,
        data: errorData,
      },
    };

    const parsed = parseBackendError(error);
    
    // Show toast notification
    useToastStore.getState().error(parsed.title, parsed.message);

    throw new Error(parsed.message);
  }
  return res.json();
}

// Helper to show success toast
function showSuccess(title: string, message: string) {
  useToastStore.getState().success(title, message);
}

// Service de database adaptatif (Electron vs Web)
export const dbService = {
  // Templates
  async getTemplates(): Promise<Template[]> {
    if (isElectron() && electronAPI) {
      return electronAPI.getTemplates();
    } else {
      const res = await fetch('/api/templates');
      const templates = await handleResponse(res, 'récupération des templates');
      // Parse properties from string to object for all templates
      return templates.map((template: any) => ({
        ...template,
        elements: template.elements?.map((el: any) => ({
          ...el,
          properties: typeof el.properties === 'string' ? JSON.parse(el.properties) : el.properties,
        })) || [],
      }));
    }
  },

  async getTemplate(id: string): Promise<Template | null> {
    if (isElectron() && electronAPI) {
      return electronAPI.getTemplate(id);
    } else {
      const res = await fetch(`/api/templates/${id}`);
      const template = await handleResponse(res, 'récupération du template');
      // Parse properties from string to object
      if (template && template.elements) {
        template.elements = template.elements.map((el: any) => ({
          ...el,
          properties: typeof el.properties === 'string' ? JSON.parse(el.properties) : el.properties,
        }));
      }
      return template;
    }
  },

  async createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> {
    if (isElectron() && electronAPI) {
      const result = await electronAPI.createTemplate(template);
      showSuccess('Template créé', `Le template "${template.name}" a été créé avec succès.`);
      return result;
    } else {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      const result = await handleResponse(res, 'création du template');
      showSuccess('Template créé', `Le template "${template.name}" a été créé avec succès.`);
      return result;
    }
  },

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
    if (isElectron() && electronAPI) {
      const result = await electronAPI.updateTemplate(id, updates);
      return result;
    } else {
      // Use PUT if elements are included, PATCH for property-only updates
      const hasElements = 'elements' in updates && updates.elements !== undefined;
      const res = await fetch(`/api/templates/${id}`, {
        method: hasElements ? 'PUT' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const template = await handleResponse(res, 'mise à jour du template');
      // Parse properties from string to object
      if (template && template.elements) {
        template.elements = template.elements.map((el: any) => ({
          ...el,
          properties: typeof el.properties === 'string' ? JSON.parse(el.properties) : el.properties,
        }));
      }
      return template;
    }
  },

  // Update a single element (preserves element ID)
  async updateElement(templateId: string, elementId: string, updates: Partial<Template['elements'][0]>): Promise<Template> {
    if (isElectron() && electronAPI) {
      // Fallback to updateTemplate for Electron
      const template = await electronAPI.getTemplate(templateId);
      if (!template) throw new Error('Template not found');
      const updatedElements = template.elements.map((el: any) =>
        el.id === elementId ? { ...el, ...updates } : el
      );
      return electronAPI.updateTemplate(templateId, { elements: updatedElements });
    } else {
      const res = await fetch(`/api/templates/${templateId}/elements/${elementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const template = await handleResponse(res, 'mise à jour de l\'élément');
      // Parse properties from string to object
      if (template && template.elements) {
        template.elements = template.elements.map((el: any) => ({
          ...el,
          properties: typeof el.properties === 'string' ? JSON.parse(el.properties) : el.properties,
        }));
      }
      return template;
    }
  },

  async deleteTemplate(id: string): Promise<void> {
    if (isElectron() && electronAPI) {
      await electronAPI.deleteTemplate(id);
      showSuccess('Template supprimé', 'Le template a été supprimé avec succès.');
    } else {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      await handleResponse(res, 'suppression du template');
      showSuccess('Template supprimé', 'Le template a été supprimé avec succès.');
    }
  },

  // Mappings
  async getMappings(): Promise<Mapping[]> {
    if (isElectron() && electronAPI) {
      return electronAPI.getMappings();
    } else {
      const res = await fetch('/api/mappings');
      return handleResponse(res, 'récupération des mappings');
    }
  },

  async getMappingsByTemplate(templateId: string): Promise<Mapping[]> {
    if (isElectron() && electronAPI) {
      return electronAPI.getMappingsByTemplate(templateId);
    } else {
      const res = await fetch(`/api/mappings?templateId=${templateId}`);
      return handleResponse(res, 'récupération des mappings');
    }
  },

  async createMapping(mapping: Omit<Mapping, 'id' | 'createdAt' | 'updatedAt'>): Promise<Mapping> {
    if (isElectron() && electronAPI) {
      const result = await electronAPI.createMapping(mapping);
      showSuccess('Mapping créé', `Le mapping "${mapping.name}" a été créé avec succès.`);
      return result;
    } else {
      const res = await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapping),
      });
      const result = await handleResponse(res, 'création du mapping');
      showSuccess('Mapping créé', `Le mapping "${mapping.name}" a été créé avec succès.`);
      return result;
    }
  },

  async updateMapping(id: string, updates: Partial<Mapping>): Promise<Mapping> {
    if (isElectron() && electronAPI) {
      return electronAPI.updateMapping(id, updates);
    } else {
      const res = await fetch(`/api/mappings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result = await handleResponse(res, 'mise à jour du mapping');
      showSuccess('Mapping mis à jour', 'Le mapping a été mis à jour avec succès.');
      return result;
    }
  },

  async deleteMapping(id: string): Promise<void> {
    if (isElectron() && electronAPI) {
      await electronAPI.deleteMapping(id);
      showSuccess('Mapping supprimé', 'Le mapping a été supprimé avec succès.');
    } else {
      const res = await fetch(`/api/mappings/${id}`, { method: 'DELETE' });
      await handleResponse(res, 'suppression du mapping');
      showSuccess('Mapping supprimé', 'Le mapping a été supprimé avec succès.');
    }
  },

  // Layout Presets
  async getLayoutPresets(templateId: string): Promise<any[]> {
    const res = await fetch(`/api/layout-presets?templateId=${templateId}`);
    return handleResponse(res, 'récupération des présélections');
  },

  async createLayoutPreset(preset: any): Promise<any> {
    const res = await fetch('/api/layout-presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preset),
    });
    const result = await handleResponse(res, 'création de la présélection');
    showSuccess('Présélection créée', `La présélection "${preset.name}" a été créée avec succès.`);
    return result;
  },

  async deleteLayoutPreset(id: string): Promise<void> {
    const res = await fetch(`/api/layout-presets/${id}`, { method: 'DELETE' });
    await handleResponse(res, 'suppression de la présélection');
    showSuccess('Présélection supprimée', 'La présélection a été supprimée avec succès.');
  },

  // Session Data (replaces localStorage)
  async getSessionData(templateId: string): Promise<any> {
    const res = await fetch(`/api/session-data/${templateId}`);
    return handleResponse(res, 'récupération des données de session');
  },

  async saveSessionData(templateId: string, data: any): Promise<any> {
    const res = await fetch(`/api/session-data/${templateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'sauvegarde des données de session');
  },

  async deleteSessionData(templateId: string): Promise<void> {
    const res = await fetch(`/api/session-data/${templateId}`, { method: 'DELETE' });
    await handleResponse(res, 'suppression des données de session');
  },
};

// PDF Service
export const pdfService = {
  async generateAndSavePDF(
    template: Template,
    csvData: string[][],
    csvHeaders: string[],
    mapping: Record<string, string>,
    pdfOptions: any,
    labelLayout: any
  ): Promise<void> {
    if (isElectron() && electronAPI) {
      // Mode Electron: générer puis sauvegarder
      const pdfBuffer = await electronAPI.generatePDF({
        template,
        csvData,
        csvHeaders,
        mapping,
        pdfOptions,
        labelLayout,
      });
      
      const result = await electronAPI.savePDF(pdfBuffer, `${template.name}_labels.pdf`);
      if (!result.success) {
        throw new Error('Failed to save PDF');
      }
    } else {
      // Mode Web: utiliser le navigateur
      const { generateLabelPDF } = await import('../utils/pdfGenerator');
      const doc = await generateLabelPDF({
        template,
        csvData,
        csvHeaders,
        mapping,
        pdfOptions,
        labelLayout,
      });
      doc.save(`${template.name}_labels.pdf`);
    }
  },
};

// App info
export const appService = {
  async getVersion(): Promise<string> {
    if (isElectron() && electronAPI) {
      return electronAPI.getVersion();
    }
    return '1.0.0-web';
  },

  isElectron(): boolean {
    return isElectron();
  },
};
