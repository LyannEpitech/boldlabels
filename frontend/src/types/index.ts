// Types BoldLabels - Selon CDC Technique

export type ElementType = 'text' | 'barcode' | 'qrcode' | 'image';

export interface Template {
  id: string;
  name: string;
  description?: string;
  width: number; // mm
  height: number; // mm
  unit: 'mm' | 'px';
  backgroundColor: string;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  elements: TemplateElement[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateElement {
  id: string;
  type: ElementType;
  variableName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  properties: ElementProperties;
  zIndex: number;
}

// Propriétés par type d'élément
export interface TextProperties {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color: string;
  align: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
}

export interface BarcodeProperties {
  format: 'EAN13' | 'EAN8' | 'CODE128' | 'UPC';
  displayValue: boolean;
  lineColor: string;
  backgroundColor: string;
}

export interface QRCodeProperties {
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  color: string;
  backgroundColor: string;
}

export interface ImageProperties {
  src: string; // URL ou base64
  objectFit: 'contain' | 'cover' | 'fill';
}

export type ElementProperties =
  | TextProperties
  | BarcodeProperties
  | QRCodeProperties
  | ImageProperties;

// Mapping
export interface Mapping {
  id: string;
  name: string;
  templateId: string;
  columnMappings: ColumnMapping[];
  csvSample?: string[]; // Première ligne du CSV
  createdAt: string;
  updatedAt: string;
}

export interface ColumnMapping {
  variableName: string;
  columnIndex: number;
  columnName: string;
}

// CSV
export interface CsvData {
  headers: string[];
  rows: string[][];
}

// PDF
export interface PDFOptions {
  pageSize: 'A4' | 'A5' | 'Letter';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  orientation: 'portrait' | 'landscape';
}

export interface LabelLayout {
  labelsPerRow: number;
  labelsPerColumn: number;
  labelsPerPage: number;
  horizontalSpacing: number;
  verticalSpacing: number;
}

// Canvas state
export interface CanvasState {
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}
