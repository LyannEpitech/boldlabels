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
  Image: ({ image, x, y, width, height }: any) => (
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
  width: widthMm,
  height: heightMm,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#000000',
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
      properties: {
        fontSize: 12,
        fontFamily: 'Arial',
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
    const expectedWidth = 40 * MM_TO_PX;
    const expectedHeight = 20 * MM_TO_PX;

    expect(Number(stage.dataset.width)).toBeCloseTo(expectedWidth, 1);
    expect(Number(stage.dataset.height)).toBeCloseTo(expectedHeight, 1);
  });

  it('should apply scale correctly to stage', () => {
    const template = createMockTemplate(40, 20);
    const scale = 0.5;
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
    
    // Stage dimensions should be in pixels (mm * MM_TO_PX)
    const expectedWidth = 40 * MM_TO_PX;
    const expectedHeight = 20 * MM_TO_PX;
    
    expect(Number(stage.dataset.width)).toBeCloseTo(expectedWidth, 1);
    expect(Number(stage.dataset.height)).toBeCloseTo(expectedHeight, 1);
    
    // Scale should be applied via scaleX/scaleY
    expect(Number(stage.dataset.scalex)).toBe(scale);
    expect(Number(stage.dataset.scaley)).toBe(scale);
  });

  it('should render background rect with correct dimensions', () => {
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

    const rects = document.querySelectorAll('[data-testid="rect"]');
    const backgroundRect = Array.from(rects).find(
      (r) => r.getAttribute('data-fill') === '#FFFFFF'
    );

    expect(backgroundRect).toBeTruthy();
    expect(Number(backgroundRect!.getAttribute('data-width'))).toBeCloseTo(
      40 * MM_TO_PX,
      1
    );
    expect(Number(backgroundRect!.getAttribute('data-height'))).toBeCloseTo(
      20 * MM_TO_PX,
      1
    );
  });

  it('should handle different template sizes correctly', () => {
    const sizes = [
      { width: 50, height: 30 },
      { width: 25, height: 15 },
      { width: 100, height: 50 },
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
      
      unmount(); // Clean up after each iteration
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
          properties: {
            fontSize: 12,
            fontFamily: 'Arial',
            color: '#000000',
            align: 'left',
            verticalAlign: 'top',
          },
        },
      ],
    };

    const { getByTestId } = render(
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
          properties: {
            fontSize: fontSizePt,
            fontFamily: 'Arial',
            color: '#000000',
          },
        },
      ],
    };

    const { getByTestId } = render(
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

    // Font size should be converted: pt * 1.333 = px
    const expectedFontSizePx = fontSizePt * 1.333;
    expect(Number(textElement.getAttribute('data-font-size'))).toBeCloseTo(
      expectedFontSizePx,
      1
    );
  });
});

describe('LabelPreview - Border', () => {
  it('should render border with correct stroke width in pixels', () => {
    const template = createMockTemplate(40, 20);
    template.borderWidth = 2;
    
    const { container } = render(
      <LabelPreview
        template={template}
        rowData={['Test']}
        csvHeaders={['productName']}
        mapping={{ productName: 'productName' }}
        scale={1}
      />
    );

    const rects = container.querySelectorAll('[data-testid="rect"]');
    const borderRect = Array.from(rects).find(
      (r) => r.getAttribute('data-stroke') === '#000000'
    );

    expect(borderRect).toBeTruthy();
    // Border width in pixels (mm * MM_TO_PX)
    expect(Number(borderRect!.getAttribute('data-stroke-width'))).toBeCloseTo(
      2 * MM_TO_PX,
      1
    );
  });
});
