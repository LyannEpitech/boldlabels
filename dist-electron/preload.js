"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose API to renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Templates
    getTemplates: () => electron_1.ipcRenderer.invoke('db:getTemplates'),
    getTemplate: (id) => electron_1.ipcRenderer.invoke('db:getTemplate', id),
    createTemplate: (template) => electron_1.ipcRenderer.invoke('db:createTemplate', template),
    updateTemplate: (id, updates) => electron_1.ipcRenderer.invoke('db:updateTemplate', id, updates),
    deleteTemplate: (id) => electron_1.ipcRenderer.invoke('db:deleteTemplate', id),
    // Mappings
    getMappings: () => electron_1.ipcRenderer.invoke('db:getMappings'),
    getMappingsByTemplate: (templateId) => electron_1.ipcRenderer.invoke('db:getMappingsByTemplate', templateId),
    createMapping: (mapping) => electron_1.ipcRenderer.invoke('db:createMapping', mapping),
    deleteMapping: (id) => electron_1.ipcRenderer.invoke('db:deleteMapping', id),
    // PDF
    generatePDF: (data) => electron_1.ipcRenderer.invoke('pdf:generate', data),
    savePDF: (pdfData, filename) => electron_1.ipcRenderer.invoke('fs:savePDF', pdfData, filename),
    // App
    getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
    getPath: (name) => electron_1.ipcRenderer.invoke('app:getPath', name),
});
//# sourceMappingURL=preload.js.map