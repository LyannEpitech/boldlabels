import { contextBridge, ipcRenderer } from 'electron';

// Expose API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Templates
  getTemplates: () => ipcRenderer.invoke('db:getTemplates'),
  getTemplate: (id: string) => ipcRenderer.invoke('db:getTemplate', id),
  createTemplate: (template: any) => ipcRenderer.invoke('db:createTemplate', template),
  updateTemplate: (id: string, updates: any) => ipcRenderer.invoke('db:updateTemplate', id, updates),
  deleteTemplate: (id: string) => ipcRenderer.invoke('db:deleteTemplate', id),
  
  // Mappings
  getMappings: () => ipcRenderer.invoke('db:getMappings'),
  getMappingsByTemplate: (templateId: string) => ipcRenderer.invoke('db:getMappingsByTemplate', templateId),
  createMapping: (mapping: any) => ipcRenderer.invoke('db:createMapping', mapping),
  deleteMapping: (id: string) => ipcRenderer.invoke('db:deleteMapping', id),
  
  // PDF
  generatePDF: (data: any) => ipcRenderer.invoke('pdf:generate', data),
  savePDF: (pdfData: ArrayBuffer, filename: string) => ipcRenderer.invoke('fs:savePDF', pdfData, filename),
  
  // App
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getTemplates: () => Promise<any[]>;
      getTemplate: (id: string) => Promise<any>;
      createTemplate: (template: any) => Promise<any>;
      updateTemplate: (id: string, updates: any) => Promise<any>;
      deleteTemplate: (id: string) => Promise<{ success: boolean }>;
      
      getMappings: () => Promise<any[]>;
      getMappingsByTemplate: (templateId: string) => Promise<any[]>;
      createMapping: (mapping: any) => Promise<any>;
      deleteMapping: (id: string) => Promise<{ success: boolean }>;
      
      generatePDF: (data: any) => Promise<ArrayBuffer>;
      savePDF: (pdfData: ArrayBuffer, filename: string) => Promise<{ success: boolean; path?: string }>;
      
      getVersion: () => Promise<string>;
      getPath: (name: string) => Promise<string>;
    };
  }
}
