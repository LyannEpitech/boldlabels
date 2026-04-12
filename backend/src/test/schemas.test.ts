import { describe, it, expect } from 'vitest';
import { TemplateSchema, TemplateElementSchema } from '../../schemas';

describe('TemplateSchema', () => {
  it('should validate a valid template', () => {
    const validTemplate = {
      name: 'Test Template',
      width: 100,
      height: 50,
      unit: 'mm',
      backgroundColor: '#FFFFFF',
      borderWidth: 0,
      borderColor: '#000000',
      borderRadius: 0,
    };

    const result = TemplateSchema.safeParse(validTemplate);
    expect(result.success).toBe(true);
  });

  it('should reject template with missing name', () => {
    const invalidTemplate = {
      width: 100,
      height: 50,
    };

    const result = TemplateSchema.safeParse(invalidTemplate);
    expect(result.success).toBe(false);
  });

  it('should reject negative dimensions', () => {
    const invalidTemplate = {
      name: 'Test',
      width: -100,
      height: 50,
    };

    const result = TemplateSchema.safeParse(invalidTemplate);
    expect(result.success).toBe(false);
  });
});

describe('TemplateElementSchema', () => {
  it('should validate a valid text element', () => {
    const validElement = {
      type: 'text',
      variableName: 'productName',
      x: 10,
      y: 10,
      width: 50,
      height: 20,
      rotation: 0,
      properties: {
        fontFamily: 'Arial',
        fontSize: 12,
        color: '#000000',
      },
      zIndex: 0,
    };

    const result = TemplateElementSchema.safeParse(validElement);
    expect(result.success).toBe(true);
  });

  it('should reject invalid element type', () => {
    const invalidElement = {
      type: 'invalid',
      variableName: 'test',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      rotation: 0,
      properties: {},
      zIndex: 0,
    };

    const result = TemplateElementSchema.safeParse(invalidElement);
    expect(result.success).toBe(false);
  });
});
