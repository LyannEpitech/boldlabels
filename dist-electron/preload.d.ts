declare global {
    interface Window {
        electronAPI: {
            getTemplates: () => Promise<any[]>;
            getTemplate: (id: string) => Promise<any>;
            createTemplate: (template: any) => Promise<any>;
            updateTemplate: (id: string, updates: any) => Promise<any>;
            deleteTemplate: (id: string) => Promise<{
                success: boolean;
            }>;
            getMappings: () => Promise<any[]>;
            getMappingsByTemplate: (templateId: string) => Promise<any[]>;
            createMapping: (mapping: any) => Promise<any>;
            deleteMapping: (id: string) => Promise<{
                success: boolean;
            }>;
            generatePDF: (data: any) => Promise<ArrayBuffer>;
            savePDF: (pdfData: ArrayBuffer, filename: string) => Promise<{
                success: boolean;
                path?: string;
            }>;
            getVersion: () => Promise<string>;
            getPath: (name: string) => Promise<string>;
        };
    }
}
export {};
