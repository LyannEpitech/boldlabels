"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_1 = __importDefault(require("fs"));
let mainWindow;
let db;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, 'preload.js'),
        },
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        show: false,
    });
    // Load frontend
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}
// Initialize SQLite database
function initDatabase() {
    const userDataPath = electron_1.app.getPath('userData');
    const dbPath = path_1.default.join(userDataPath, 'boldlabels.db');
    console.log('Database path:', dbPath);
    db = new better_sqlite3_1.default(dbPath);
    // Create tables
    db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      width REAL NOT NULL,
      height REAL NOT NULL,
      unit TEXT DEFAULT 'mm',
      backgroundColor TEXT DEFAULT '#FFFFFF',
      borderWidth REAL DEFAULT 0,
      borderColor TEXT DEFAULT '#000000',
      borderRadius REAL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS template_elements (
      id TEXT PRIMARY KEY,
      templateId TEXT NOT NULL,
      type TEXT NOT NULL,
      variableName TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      width REAL,
      height REAL,
      rotation REAL DEFAULT 0,
      properties TEXT,
      zIndex INTEGER DEFAULT 0,
      FOREIGN KEY (templateId) REFERENCES templates(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS mappings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      templateId TEXT NOT NULL,
      columnMappings TEXT NOT NULL,
      csvSample TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (templateId) REFERENCES templates(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_elements_template ON template_elements(templateId);
    CREATE INDEX IF NOT EXISTS idx_mappings_template ON mappings(templateId);
  `);
}
// IPC Handlers for Templates
electron_1.ipcMain.handle('db:getTemplates', () => {
    const templates = db.prepare('SELECT * FROM templates ORDER BY updatedAt DESC').all();
    return templates.map((template) => {
        const elements = db.prepare('SELECT * FROM template_elements WHERE templateId = ?').all(template.id);
        return {
            ...template,
            elements: elements.map((el) => ({
                ...el,
                properties: JSON.parse(el.properties || '{}'),
            })),
        };
    });
});
electron_1.ipcMain.handle('db:getTemplate', (_, id) => {
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
    if (!template)
        return null;
    const elements = db.prepare('SELECT * FROM template_elements WHERE templateId = ?').all(id);
    return {
        ...template,
        elements: elements.map((el) => ({
            ...el,
            properties: JSON.parse(el.properties || '{}'),
        })),
    };
});
electron_1.ipcMain.handle('db:createTemplate', (_, template) => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
    INSERT INTO templates (id, name, description, width, height, unit, 
      backgroundColor, borderWidth, borderColor, borderRadius, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(id, template.name, template.description || '', template.width, template.height, template.unit || 'mm', template.backgroundColor || '#FFFFFF', template.borderWidth || 0, template.borderColor || '#000000', template.borderRadius || 0, now, now);
    // Insert elements
    if (template.elements?.length > 0) {
        const elementStmt = db.prepare(`
      INSERT INTO template_elements 
      (id, templateId, type, variableName, x, y, width, height, rotation, properties, zIndex)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        for (const el of template.elements) {
            elementStmt.run(crypto.randomUUID(), id, el.type, el.variableName, el.x, el.y, el.width, el.height, el.rotation || 0, JSON.stringify(el.properties), el.zIndex || 0);
        }
    }
    return { id, ...template, createdAt: now, updatedAt: now };
});
electron_1.ipcMain.handle('db:updateTemplate', (_, id, updates) => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
    UPDATE templates SET 
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      width = COALESCE(?, width),
      height = COALESCE(?, height),
      backgroundColor = COALESCE(?, backgroundColor),
      borderWidth = COALESCE(?, borderWidth),
      borderColor = COALESCE(?, borderColor),
      borderRadius = COALESCE(?, borderRadius),
      updatedAt = ?
    WHERE id = ?
  `);
    stmt.run(updates.name, updates.description, updates.width, updates.height, updates.backgroundColor, updates.borderWidth, updates.borderColor, updates.borderRadius, now, id);
    // Update elements if provided
    if (updates.elements) {
        db.prepare('DELETE FROM template_elements WHERE templateId = ?').run(id);
        const elementStmt = db.prepare(`
      INSERT INTO template_elements 
      (id, templateId, type, variableName, x, y, width, height, rotation, properties, zIndex)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        for (const el of updates.elements) {
            elementStmt.run(crypto.randomUUID(), id, el.type, el.variableName, el.x, el.y, el.width, el.height, el.rotation || 0, JSON.stringify(el.properties), el.zIndex || 0);
        }
    }
    return { id, ...updates, updatedAt: now };
});
electron_1.ipcMain.handle('db:deleteTemplate', (_, id) => {
    db.prepare('DELETE FROM templates WHERE id = ?').run(id);
    return { success: true };
});
// IPC Handlers for Mappings
electron_1.ipcMain.handle('db:getMappings', () => {
    const mappings = db.prepare('SELECT * FROM mappings ORDER BY updatedAt DESC').all();
    return mappings.map((m) => ({
        ...m,
        columnMappings: JSON.parse(m.columnMappings),
        csvSample: m.csvSample ? JSON.parse(m.csvSample) : [],
    }));
});
electron_1.ipcMain.handle('db:getMappingsByTemplate', (_, templateId) => {
    const mappings = db.prepare('SELECT * FROM mappings WHERE templateId = ? ORDER BY updatedAt DESC').all(templateId);
    return mappings.map((m) => ({
        ...m,
        columnMappings: JSON.parse(m.columnMappings),
        csvSample: m.csvSample ? JSON.parse(m.csvSample) : [],
    }));
});
electron_1.ipcMain.handle('db:createMapping', (_, mapping) => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
    INSERT INTO mappings (id, name, templateId, columnMappings, csvSample, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(id, mapping.name, mapping.templateId, JSON.stringify(mapping.columnMappings), mapping.csvSample ? JSON.stringify(mapping.csvSample) : null, now, now);
    return { id, ...mapping, createdAt: now, updatedAt: now };
});
electron_1.ipcMain.handle('db:updateMapping', (_, id, updates) => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
    UPDATE mappings SET 
      name = COALESCE(?, name),
      columnMappings = COALESCE(?, columnMappings),
      csvSample = COALESCE(?, csvSample),
      updatedAt = ?
    WHERE id = ?
  `);
    stmt.run(updates.name, updates.columnMappings ? JSON.stringify(updates.columnMappings) : null, updates.csvSample ? JSON.stringify(updates.csvSample) : null, now, id);
    return { id, ...updates, updatedAt: now };
});
electron_1.ipcMain.handle('db:deleteMapping', (_, id) => {
    db.prepare('DELETE FROM mappings WHERE id = ?').run(id);
    return { success: true };
});
// PDF Generation - simplified for now
electron_1.ipcMain.handle('pdf:generate', async (_, data) => {
    // For now, return empty buffer - PDF generation will be done in renderer
    // This avoids importing frontend code into main process
    return new ArrayBuffer(0);
});
// File System - Save PDF
electron_1.ipcMain.handle('fs:savePDF', async (_, pdfData, defaultFilename) => {
    const { filePath, canceled } = await electron_1.dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultFilename,
        filters: [
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'All Files', extensions: ['*'] },
        ],
    });
    if (!canceled && filePath) {
        fs_1.default.writeFileSync(filePath, Buffer.from(pdfData));
        return { success: true, path: filePath };
    }
    return { success: false };
});
// App info
electron_1.ipcMain.handle('app:getVersion', () => {
    return electron_1.app.getVersion();
});
electron_1.ipcMain.handle('app:getPath', (_, name) => {
    return electron_1.app.getPath(name);
});
// App lifecycle
electron_1.app.whenReady().then(() => {
    initDatabase();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Security: Prevent new window creation
electron_1.app.on('web-contents-created', (_, contents) => {
    contents.setWindowOpenHandler(() => {
        return { action: 'deny' };
    });
});
//# sourceMappingURL=main.js.map