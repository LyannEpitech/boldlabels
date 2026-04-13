import type { Template, Mapping } from '../types';

// Détecter si on est dans Electron
const isElectron = () => {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
};

// API Electron
const electronAPI = isElectron() ? (window as any).electronAPI : null;

// Service de database adaptatif (Electron vs Web)
export const dbService = {
  // Templates
  async getTemplates(): Promise<Template[]> {
    if (isElectron() && electronAPI) {
      return electronAPI.getTemplates();
    } else {
      const res = await fetch('/api/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    }
  },

  async getTemplate(id: string): Promise<Template | null> {
    if (isElectron() && electronAPI) {
      return electronAPI.getTemplate(id);
    } else {
      const res = await fetch(`/api/templates/${id}`);
      if (!res.ok) throw new Error('Failed to fetch template');
      return res.json();
    }
  },

  async createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> {
    if (isElectron() && electronAPI) {
      return electronAPI.createTemplate(template);
    } else {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!res.ok) throw new Error('Failed to create template');
      return res.json();
    }
  },

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
    if (isElectron() && electronAPI) {
      return electronAPI.updateTemplate(id, updates);
    } else {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update template');
      return res.json();
    }
  },

  async deleteTemplate(id: string): Promise<void> {
    if (isElectron() && electronAPI) {
      await electronAPI.deleteTemplate(id);
    } else {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete template');
    }
  },

  // Mappings
  async getMappings(): Promise<Mapping[]> {
    if (isElectron() && electronAPI) {
      return electronAPI.getMappings();
    } else {
      const res = await fetch('/api/mappings');
      if (!res.ok) throw new Error('Failed to fetch mappings');
      return res.json();
    }
  },

  async getMappingsByTemplate(templateId: string): Promise<Mapping[]> {
    if (isElectron() && electronAPI) {
      return electronAPI.getMappingsByTemplate(templateId);
    } else {
      const res = await fetch(`/api/mappings?templateId=${templateId}`);
      if (!res.ok) throw new Error('Failed to fetch mappings');
      return res.json();
    }
  },

  async createMapping(mapping: Omit<Mapping, 'id' | 'createdAt' | 'updatedAt'>): Promise<Mapping> {
    if (isElectron() && electronAPI) {
      return electronAPI.createMapping(mapping);
    } else {
      const res = await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapping),
      });
      if (!res.ok) throw new Error('Failed to create mapping');
      return res.json();
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
      if (!res.ok) throw new Error('Failed to update mapping');
      return res.json();
    }
  },

  async deleteMapping(id: string): Promise<void> {
    if (isElectron() && electronAPI) {
      await electronAPI.deleteMapping(id);
    } else {
      const res = await fetch(`/api/mappings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete mapping');
    }
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
