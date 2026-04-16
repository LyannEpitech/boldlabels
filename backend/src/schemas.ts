import { z } from 'zod';

export const TemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(['mm', 'px']).default('mm'),
  backgroundColor: z.string().default('#FFFFFF'),
  borderWidth: z.number().default(0),
  borderColor: z.string().default('#000000'),
  borderRadius: z.number().default(0),
});

// Partial schema for updates
export const TemplateUpdateSchema = TemplateSchema.partial();

export const TemplateElementSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['text', 'barcode', 'qrcode', 'image', 'rectangle']),
  variableName: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().default(0),
  properties: z.record(z.any()),
  zIndex: z.number().int(),
  templateId: z.string().optional(),
});

export const ColumnMappingSchema = z.object({
  variableName: z.string(),
  columnIndex: z.number().int().nonnegative(),
  columnName: z.string(),
});

export const MappingSchema = z.object({
  name: z.string().min(1),
  templateId: z.string().uuid(),
  columnMappings: z.array(ColumnMappingSchema).default([]),
  csvSample: z.array(z.string()).optional(),
});

export type TemplateInput = z.infer<typeof TemplateSchema>;
export type TemplateElementInput = z.infer<typeof TemplateElementSchema>;
export type MappingInput = z.infer<typeof MappingSchema>;
