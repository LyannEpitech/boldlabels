import { z } from 'zod';

// Common schemas
export const UuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

export const PaginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
});

// Template schemas
export const TemplateSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  width: z.number().positive({ message: 'Width must be positive' }),
  height: z.number().positive({ message: 'Height must be positive' }),
  unit: z.enum(['mm', 'px']).default('mm'),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { 
    message: 'Invalid color format (expected hex like #FFFFFF)' 
  }).default('#FFFFFF'),
  borderWidth: z.number().min(0).default(0),
  borderColor: z.string().default('#000000'),
  borderRadius: z.number().min(0).default(0),
});

export const TemplateUpdateSchema = TemplateSchema.partial();

// Template Element schemas
export const TemplateElementSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['text', 'barcode', 'qrcode', 'image', 'rectangle'], {
    errorMap: () => ({ message: 'Invalid element type' })
  }),
  variableName: z.string().min(1, { message: 'Variable name is required' }),
  x: z.number({ required_error: 'X position is required' }),
  y: z.number({ required_error: 'Y position is required' }),
  width: z.number().positive({ message: 'Width must be positive' }),
  height: z.number().positive({ message: 'Height must be positive' }),
  rotation: z.number().default(0),
  properties: z.union([
    z.record(z.any()),
    z.string().transform((str) => {
      try {
        return JSON.parse(str);
      } catch {
        throw new Error('Invalid JSON in properties');
      }
    })
  ]),
  zIndex: z.number().int().min(0, { message: 'zIndex must be non-negative' }),
  templateId: z.string().optional(),
  groupId: z.string().nullable().optional(),
});

export const TemplateElementUpdateSchema = TemplateElementSchema.partial();

// Element update for PATCH endpoint
export const ElementPatchSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  rotation: z.number().optional(),
  properties: z.union([z.record(z.any()), z.string()]).optional(),
  zIndex: z.number().int().min(0).optional(),
  groupId: z.string().nullable().optional(),
  variableName: z.string().min(1).optional(),
});

// Route params schemas
export const TemplateParamsSchema = z.object({
  id: UuidSchema,
});

export const ElementParamsSchema = z.object({
  id: UuidSchema,
  elementId: UuidSchema,
});

// Mapping schemas
export const ColumnMappingSchema = z.object({
  variableName: z.string().min(1),
  columnIndex: z.number().int().nonnegative(),
  columnName: z.string().min(1),
});

export const MappingSchema = z.object({
  name: z.string().min(1, { message: 'Mapping name is required' }),
  templateId: UuidSchema,
  columnMappings: z.array(ColumnMappingSchema).default([]),
  csvSample: z.string().optional(),
});

export const MappingUpdateSchema = MappingSchema.partial();

// Generate/Export schemas
export const PDFOptionsSchema = z.object({
  pageSize: z.enum(['A4', 'A5', 'Letter']).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  marginTop: z.number().min(0).default(10),
  marginRight: z.number().min(0).default(10),
  marginBottom: z.number().min(0).default(10),
  marginLeft: z.number().min(0).default(10),
});

export const LabelLayoutSchema = z.object({
  labelsPerRow: z.number().int().positive().default(3),
  labelsPerColumn: z.number().int().positive().default(8),
  horizontalSpacing: z.number().min(0).default(2),
  verticalSpacing: z.number().min(0).default(0),
});

export const GeneratePDFSchema = z.object({
  templateId: UuidSchema,
  csvData: z.array(z.array(z.string())).min(1, { message: 'CSV data is required' }),
  csvHeaders: z.array(z.string()),
  mapping: z.record(z.string()),
  pdfOptions: PDFOptionsSchema.default({}),
  labelLayout: LabelLayoutSchema.default({}),
});

// Layout preset schemas
export const LayoutPresetSchema = z.object({
  name: z.string().min(1),
  templateId: UuidSchema,
  pageSize: z.enum(['A4', 'A5', 'Letter']).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  marginTop: z.number().min(0).default(10),
  marginRight: z.number().min(0).default(10),
  marginBottom: z.number().min(0).default(10),
  marginLeft: z.number().min(0).default(10),
  labelsPerRow: z.number().int().positive().default(3),
  labelsPerColumn: z.number().int().positive().default(8),
  horizontalSpacing: z.number().min(0).default(2),
  verticalSpacing: z.number().min(0).default(0),
  isDefault: z.boolean().default(false),
});

export const LayoutPresetUpdateSchema = LayoutPresetSchema.partial();

// Type exports
export type TemplateInput = z.infer<typeof TemplateSchema>;
export type TemplateUpdateInput = z.infer<typeof TemplateUpdateSchema>;
export type TemplateElementInput = z.infer<typeof TemplateElementSchema>;
export type TemplateElementUpdateInput = z.infer<typeof TemplateElementUpdateSchema>;
export type ElementPatchInput = z.infer<typeof ElementPatchSchema>;
export type MappingInput = z.infer<typeof MappingSchema>;
export type MappingUpdateInput = z.infer<typeof MappingUpdateSchema>;
export type GeneratePDFInput = z.infer<typeof GeneratePDFSchema>;
export type LayoutPresetInput = z.infer<typeof LayoutPresetSchema>;
export type LayoutPresetUpdateInput = z.infer<typeof LayoutPresetUpdateSchema>;
