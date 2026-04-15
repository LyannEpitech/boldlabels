import { describe, it, expect } from 'vitest';

describe('PDF Generator', () => {
  it('should calculate label layout correctly', () => {
    const pageWidth = 210;
    const pageHeight = 297;
    const margins = { top: 10, right: 10, bottom: 10, left: 10 };
    const labelWidth = 63.5;
    const labelHeight = 25.4;

    const availableWidth = pageWidth - margins.left - margins.right;
    const availableHeight = pageHeight - margins.top - margins.bottom;

    const labelsPerRow = Math.floor(availableWidth / labelWidth);
    const labelsPerColumn = Math.floor(availableHeight / labelHeight);

    expect(labelsPerRow).toBe(2);
    expect(labelsPerColumn).toBe(10); // 277 / 25.4 = 10.9, floor = 10
  });

  it('should convert mm to points correctly', () => {
    const MM_TO_PT = 2.83465;
    expect(10 * MM_TO_PT).toBeCloseTo(28.35, 1);
  });
});
