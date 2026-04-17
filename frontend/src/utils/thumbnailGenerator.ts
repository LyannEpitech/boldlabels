import type { Template } from '../types';

/**
 * Generate a thumbnail PNG from a template
 * Uses an offscreen canvas to render the template
 */
export async function generateThumbnail(
  template: Template,
  width: number = 300,
  height: number = 200
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Calculate scale to fit template in thumbnail
  const scaleX = (width - 40) / (template.width * 3.78); // 3.78 = mm to px
  const scaleY = (height - 40) / (template.height * 3.78);
  const scale = Math.min(scaleX, scaleY, 2);
  
  const labelWidth = template.width * 3.78 * scale;
  const labelHeight = template.height * 3.78 * scale;
  const offsetX = (width - labelWidth) / 2;
  const offsetY = (height - labelHeight) / 2;

  // Clear background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);

  // Draw shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Draw label background
  ctx.fillStyle = template.backgroundColor;
  ctx.fillRect(offsetX, offsetY, labelWidth, labelHeight);
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw border
  if (template.borderWidth > 0) {
    ctx.strokeStyle = template.borderColor;
    ctx.lineWidth = template.borderWidth * scale;
    ctx.strokeRect(offsetX, offsetY, labelWidth, labelHeight);
  }

  // Draw elements (simplified representation)
  const sortedElements = [...template.elements].sort((a, b) => a.zIndex - b.zIndex);
  
  for (const element of sortedElements) {
    const ex = offsetX + (element.x * 3.78 * scale);
    const ey = offsetY + (element.y * 3.78 * scale);
    const ew = element.width * 3.78 * scale;
    const eh = element.height * 3.78 * scale;

    switch (element.type) {
      case 'text':
        const textProps = JSON.parse((element.properties as string) || '{}');
        ctx.fillStyle = textProps.color || '#000000';
        ctx.font = `${textProps.fontStyle === 'bold' ? 'bold ' : ''}${Math.max(8, (textProps.fontSize || 12) * scale * 0.3)}px ${textProps.fontFamily || 'Arial'}`;
        ctx.textAlign = (textProps.align || 'left') as CanvasTextAlign;
        ctx.textBaseline = 'middle';
        
        const textX = textProps.align === 'center' ? ex + ew / 2 : 
                      textProps.align === 'right' ? ex + ew : ex;
        ctx.fillText(element.variableName.slice(0, 15), textX, ey + eh / 2, ew);
        break;

      case 'barcode':
        // Draw barcode placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(ex, ey, ew, eh);
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(ex, ey, ew, eh);
        
        // Draw barcode lines
        ctx.fillStyle = '#000000';
        const lineCount = Math.floor(ew / 3);
        for (let i = 0; i < lineCount; i += 2) {
          ctx.fillRect(ex + i * 3, ey + 2, 2, eh - 4);
        }
        break;

      case 'qrcode':
        // Draw QR code placeholder
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ex, ey, ew, eh);
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(ex, ey, ew, eh);
        
        // Draw QR pattern
        ctx.fillStyle = '#000000';
        const qrSize = Math.min(ew, eh) / 7;
        for (let row = 0; row < 7; row++) {
          for (let col = 0; col < 7; col++) {
            if ((row + col) % 2 === 0) {
              ctx.fillRect(ex + col * qrSize, ey + row * qrSize, qrSize, qrSize);
            }
          }
        }
        break;

      case 'image':
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(ex, ey, ew, eh);
        ctx.strokeStyle = '#cccccc';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(ex, ey, ew, eh);
        ctx.setLineDash([]);
        break;

      case 'rectangle':
        const rectProps = JSON.parse((element.properties as string) || '{}');
        ctx.fillStyle = rectProps.fillColor || 'transparent';
        ctx.fillRect(ex, ey, ew, eh);
        if (rectProps.strokeColor) {
          ctx.strokeStyle = rectProps.strokeColor;
          ctx.lineWidth = (rectProps.strokeWidth || 1) * scale;
          ctx.strokeRect(ex, ey, ew, eh);
        }
        break;
    }
  }

  return canvas.toDataURL('image/png');
}

/**
 * Generate thumbnail on the server side (for initial creation)
 * This is a simplified version that creates a placeholder
 */
export function generateThumbnailPlaceholder(
  template: Template
): { dataUrl: string; width: number; height: number } {
  const width = 300;
  const height = 200;
  
  // Create a simple SVG placeholder
  const aspectRatio = template.width / template.height;
  const labelWidth = aspectRatio > 1.5 ? 200 : 150;
  const labelHeight = labelWidth / aspectRatio;
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f3f4f6"/>
      <rect x="${(width - labelWidth) / 2}" y="${(height - labelHeight) / 2}" 
            width="${labelWidth}" height="${labelHeight}" 
            fill="${template.backgroundColor}" 
            stroke="${template.borderColor}" 
            stroke-width="${Math.max(1, template.borderWidth)}"
            rx="${template.borderRadius}"/>
      <text x="${width / 2}" y="${height / 2}" 
            text-anchor="middle" 
            font-family="Arial" 
            font-size="12"
            fill="#666666">
        ${template.width}×${template.height}mm
      </text>
      <text x="${width / 2}" y="${height / 2 + 16}" 
            text-anchor="middle" 
            font-family="Arial" 
            font-size="10"
            fill="#999999">
        ${template.elements.length} éléments
      </text>
    </svg>
  `;
  
  const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  
  return { dataUrl, width, height };
}
