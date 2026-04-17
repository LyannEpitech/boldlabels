import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { LabelPreview } from '../components/LabelPreview';
import type { Template } from '../types';

// Mock Konva and related modules
vi.mock('react-konva', () => ({
  Stage: ({ children, width, height, scaleX, scaleY }: any) => (
    <div data-testid="stage" data-width={width} data-height={height} data-scalex={scaleX} data-scaley={scaleY}>
      {children}
    </div>
  ),
  Layer: ({ children }: any) => <div data-testid="layer">{children}</div>,
  Rect: ({ width, height, x, y, fill, stroke, strokeWidth }: any) => (
    <div 
      data-testid="rect" 
      data-width={width} 
      data-height={height}
      data-x={x}
      data-y={y}
      data-fill={fill}
      data-stroke={stroke}
      data-stroke-width={strokeWidth}
    />
  ),
  Text: ({ text, x, y, width, height, fontSize, fill, align, verticalAlign }: any) => (
    <div 
      data-testid="text"
      data-text={text}
      data-x={x}
      data-y={y}
      data-width={width}
      data-height={height}
      data-font-size={fontSize}
      data-fill={fill}
      data-align={align}
      data-vertical-align={verticalAlign}
    >
      {text}
    </div>
  ),
  Image: ({ x, y, width, height }: any) => (
    <div 
      data-testid="image"
      data-x={x}
      data-y={y}
      data-width={width}
      data-height={height}
    />
  ),
}));

vi.mock('jsbarcode', () => ({
  default: vi.fn(),
}));

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,test'),
  },
}));

// Constants (must match component)
const MM_TO_PX = 3.7795275591;

// Mock template factory
const createMockTemplate = (widthMm = 40, heightMm = 20): Template => ({
  id: 'test-template',
  name: 'Test Template',
  description: undefined,
  width: widthMm,
  height: heightMm,
  unit: 'mm',
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#000000',
  borderRadius: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  elements: [
    {
      id: 'text-1',
      type: 'text',
      variableName: 'productName',
      x: 5,
      y: 5,
      width: 30,
      height: 10,
      rotation: 0,
      zIndex: 1,
      properties: {
        fontSize: 12,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#000000',
        align: 'center',
        verticalAlign: 'middle',
      },
    },
  ],
});

describe('LabelPreview - Dimensions', () => {
  it('should render stage with correct pixel dimensions', () => {
    const template = createMockTemplate(40, 20);

    const { getByTestId } = render(
      <LabelPreview
        template={template}
        rowData={['Test Product']}
        csvHeaders={['productName']}
        mapping={{ productName: 'productName' }}
        scale={1}
      />
    );

    const stage = getByTestId('stage');
    expect(Number(stage.dataset.width)).toBeCloseTo(40 * MM_TO_PX, 1);
    expect(Number(stage.dataset.height)).toBeCloseTo(20 * MM_TO_PX, 1);
  });

  it('should apply scale correctly', () => {
    const template = createMockTemplate(40, 20);
    const scale = 2;

    const { getByTestId } = render(
      <LabelPreview
        template={template}
        rowData={['Test Product']}
        csvHeaders={['productName']}
        mapping={{ productName: 'productName' }}
        scale={scale}
      />
    );

    const stage = getByTestId('stage');
    // Stage dimensions stay the same, scale is applied via scaleX/scaleY
    expect(Number(stage.dataset.width)).toBeCloseTo(40 * MM_TO_PX, 1);
    expect(Number(stage.dataset.height)).toBeCloseTo(20 * MM_TO_PX, 1);
    expect(Number(stage.dataset.scalex)).toBe(scale);
    expect(Number(stage.dataset.scaley)).toBe(scale);
  });

  it('should handle different template sizes', () => {
    const sizes = [
      { width: 38.1, height: 21.2 }, // Avery 5167
      { width: 63.5, height: 25.4 }, // Avery 5160
      { width: 101.6, height: 50.8 }, // Avery 5163
    ];

    for (const size of sizes) {
      const template = createMockTemplate(size.width, size.height);
      
      const { getByTestId, unmount } = render(
        <LabelPreview
          template={template}
          rowData={['Test']}
          csvHeaders={['productName']}
          mapping={{ productName: 'productName' }}
          scale={1}
        />
      );

      const stage = getByTestId('stage');
      expect(Number(stage.dataset.width)).toBeCloseTo(
        size.width * MM_TO_PX,
        1
      );
      expect(Number(stage.dataset.height)).toBeCloseTo(
        size.height * MM_TO_PX,
        1
      );
      
      unmount();
    }
  });
});

describe('LabelPreview - Element Positioning', () => {
  it('should position text elements correctly in pixels', () => {
    const template: Template = {
      ...createMockTemplate(40, 20),
      elements: [
        {
          id: 'text-1',
          type: 'text',
          variableName: 'productName',
          x: 10, // 10mm from left
          y: 5,  // 5mm from top
          width: 20,
          height: 10,
          rotation: 0,
          zIndex: 1,
          properties: {
            fontSize: 12,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            color: '#000000',
            align: 'left',
            verticalAlign: 'top',
          },
        },
      ],
    };

    render(
      <LabelPreview
        template={template}
        rowData={['Test Product']}
        csvHeaders={['productName']}
        mapping={{ productName: 'productName' }}
        scale={1}
      />
    );

    const texts = document.querySelectorAll('[data-testid="text"]');
    const textElement = texts[0];

    expect(Number(textElement.getAttribute('data-x'))).toBeCloseTo(
      10 * MM_TO_PX,
      1
    );
    expect(Number(textElement.getAttribute('data-y'))).toBeCloseTo(
      5 * MM_TO_PX,
      1
    );
  });

  it('should convert font size from pt to px correctly', () => {
    const fontSizePt = 16;
    const template: Template = {
      ...createMockTemplate(40, 20),
      elements: [
        {
          id: 'text-1',
          type: 'text',
          variableName: 'productName',
          x: 5,
          y: 5,
          width: 30,
          height: 10,
          rotation: 0,
          zIndex: 1,
          properties: {
            fontSize: fontSizePt,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            color: '#000000',
            align: 'center',
            verticalAlign: 'middle',
          },
        },
      ],
    };

    render(
      <LabelPreview
        template={template}
        rowData={['Test']}
        csvHeaders={['productName']}
        mapping={{ productName: 'productName' }}
        scale={1}
      />
    );

    const texts = document.querySelectorAll('[data-testid="text"]');
    const textElement = texts[0];

    const expectedFontSizePx = fontSizePt * 1.333;
    expect(Number(textElement.getAttribute('data-font-size'))).toBeCloseTo(
      expectedFontSizePx,
      1
    );
  });
});

describe('LabelPreview - Data Mapping', () => {
  it('should map CSV data to elements correctly', () => {
    const template: Template = {
      ...createMockTemplate(40, 20),
      elements: [
        {
          id: 'text-1',
          type: 'text',
          variableName: 'productName',
          x: 5,
          y: 5,
          width: 30,
          height: 10,
          rotation: 0,
          zIndex: 1,
          properties: {
            fontSize: 12,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            color: '#000000',
            align: 'center',
            verticalAlign: 'middle',
          },
        },
        {
          id: 'text-2',
          type: 'text',
          variableName: 'price',
          x: 5,
          y: 15,
          width: 30,
          height: 5,
          rotation: 0,
          zIndex: 2,
          properties: {
            fontSize: 10,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#000000',
            align: 'left',
            verticalAlign: 'middle',
          },
        },
      ],
    };

    render(
      <LabelPreview
        template={template}
        rowData={['iPhone 15 Pro', '999.00']}
        csvHeaders={['productName', 'price']}
        mapping={{ productName: 'productName', price: 'price' }}
        scale={1}
      />
    );

    const texts = document.querySelectorAll('[data-testid="text"]');
    expect(texts[0].getAttribute('data-text')).toBe('iPhone 15 Pro');
    expect(texts[1].getAttribute('data-text')).toBe('999.00');
  });

  it('should handle missing data gracefully', () => {
    const template: Template = {
      ...createMockTemplate(40, 20),
      elements: [
        {
          id: 'text-1',
          type: 'text',
          variableName: 'missingField',
          x: 5,
          y: 5,
          width: 30,
          height: 10,
          rotation: 0,
          zIndex: 1,
          properties: {
            fontSize: 12,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            color: '#000000',
            align: 'center',
            verticalAlign: 'middle',
          },
        },
      ],
    };

    render(
      <LabelPreview
        template={template}
        rowData={['Test Product']}
        csvHeaders={['productName']}
        mapping={{}} // No mapping for missingField
        scale={1}
      />
    );

    const texts = document.querySelectorAll('[data-testid="text"]');
    // Should show variable name as fallback when no mapping exists
    expect(texts[0].textContent).toContain('missingField');
  });
});

describe('LabelPreview - Visual Elements', () => {
  it('should render background with correct color', () => {
    const template: Template = {
      ...createMockTemplate(40, 20),
      backgroundColor: '#F0F0F0',
    };

    render(
      <LabelPreview
        template={template}
        rowData={['Test']}
        csvHeaders={['productName']}
        mapping={{ productName: 'productName' }}
        scale={1}
      />
    );

    const rects = document.querySelectorAll('[data-testid="rect"]');
    const bgRect = rects[0]; // First rect is background
    expect(bgRect.getAttribute('data-fill')).toBe('#F0F0F0');
  });

  it('should render border with correct properties', () => {
    const template: Template = {
      ...createMockTemplate(40, 20),
      borderWidth: 2,
      borderColor: '#FF0000',
    };

    render(
      <LabelPreview
        template={template}
        rowData={['Test']}
        csvHeaders={['productName']}
        mapping={{ productName: 'productName' }}
        scale={1}
      />
    );

    const rects = document.querySelectorAll('[data-testid="rect"]');
    const borderRect = rects[1]; // Second rect is border
    expect(borderRect.getAttribute('data-stroke')).toBe('#FF0000');
    expect(Number(borderRect.getAttribute('data-stroke-width'))).toBeCloseTo(
      2 * MM_TO_PX,
      1
    );
  });
});
