import type { TemplateElement } from '../types';

const MM_TO_PX = 3.7795275591;
const PX_TO_MM = 1 / MM_TO_PX;

export function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

export function pxToMm(px: number): number {
  return px * PX_TO_MM;
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function calculateAlignment(
  element: TemplateElement,
  containerWidth: number,
  containerHeight: number,
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): { x: number; y: number } {
  let x = element.x;
  let y = element.y;

  switch (alignment) {
    case 'left':
      x = 0;
      break;
    case 'center':
      x = (containerWidth - element.width) / 2;
      break;
    case 'right':
      x = containerWidth - element.width;
      break;
    case 'top':
      y = 0;
      break;
    case 'middle':
      y = (containerHeight - element.height) / 2;
      break;
    case 'bottom':
      y = containerHeight - element.height;
      break;
  }

  return { x, y };
}

export function getElementBounds(elements: TemplateElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  const minX = Math.min(...elements.map((el) => el.x));
  const minY = Math.min(...elements.map((el) => el.y));
  const maxX = Math.max(...elements.map((el) => el.x + el.width));
  const maxY = Math.max(...elements.map((el) => el.y + el.height));

  return { minX, minY, maxX, maxY };
}

export function generateVariableName(type: string, existingNames: string[]): string {
  let index = 1;
  let name = `${type}_${index}`;
  
  while (existingNames.includes(name)) {
    index++;
    name = `${type}_${index}`;
  }
  
  return name;
}
