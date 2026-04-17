import { Template } from '../types';

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'retail' | 'price' | 'complete';
  thumbnail?: string;
  template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>;
}

export const presetTemplates: PresetTemplate[] = [
  {
    id: 'preset-retail-minimal',
    name: 'Retail Minimal',
    description: 'Design épuré avec prix en haut à droite, EAN-13 centré en bas',
    category: 'retail',
    template: {
      name: 'Retail Minimal (copie)',
      description: 'Template épuré pour étiquettes retail',
      width: 60,
      height: 40,
      unit: 'mm',
      backgroundColor: '#FFFFFF',
      borderWidth: 0,
      borderColor: '#000000',
      borderRadius: 0,
      elements: [
        {
          id: 'price-element',
          type: 'text',
          variableName: 'prix',
          x: 35,
          y: 5,
          width: 20,
          height: 8,
          rotation: 0,
          zIndex: 1,
          properties: JSON.stringify({
            fontSize: 14,
            fontFamily: 'helvetica',
            fontStyle: 'bold',
            color: '#000000',
            align: 'right',
            verticalAlign: 'middle',
            suffix: ' €'
          })
        },
        {
          id: 'name-element',
          type: 'text',
          variableName: 'nom',
          x: 5,
          y: 12,
          width: 50,
          height: 10,
          rotation: 0,
          zIndex: 2,
          properties: JSON.stringify({
            fontSize: 10,
            fontFamily: 'helvetica',
            fontStyle: 'normal',
            color: '#333333',
            align: 'center',
            verticalAlign: 'middle'
          })
        },
        {
          id: 'barcode-element',
          type: 'barcode',
          variableName: 'ean',
          x: 10,
          y: 26,
          width: 40,
          height: 12,
          rotation: 0,
          zIndex: 3,
          properties: JSON.stringify({
            format: 'EAN13',
            showText: true,
            height: 12
          })
        }
      ]
    }
  },
  {
    id: 'preset-price-centered',
    name: 'Prix Centré',
    description: 'Prix en grand au centre, EAN-13 en bas',
    category: 'price',
    template: {
      name: 'Prix Centré (copie)',
      description: 'Template avec prix en évidence',
      width: 60,
      height: 40,
      unit: 'mm',
      backgroundColor: '#FFFFFF',
      borderWidth: 0,
      borderColor: '#000000',
      borderRadius: 0,
      elements: [
        {
          id: 'price-big',
          type: 'text',
          variableName: 'prix',
          x: 5,
          y: 8,
          width: 50,
          height: 18,
          rotation: 0,
          zIndex: 1,
          properties: JSON.stringify({
            fontSize: 20,
            fontFamily: 'helvetica',
            fontStyle: 'bold',
            color: '#000000',
            align: 'center',
            verticalAlign: 'middle',
            suffix: ' €'
          })
        },
        {
          id: 'name-small',
          type: 'text',
          variableName: 'nom',
          x: 5,
          y: 2,
          width: 50,
          height: 6,
          rotation: 0,
          zIndex: 2,
          properties: JSON.stringify({
            fontSize: 8,
            fontFamily: 'helvetica',
            fontStyle: 'normal',
            color: '#666666',
            align: 'center',
            verticalAlign: 'middle'
          })
        },
        {
          id: 'barcode-bottom',
          type: 'barcode',
          variableName: 'ean',
          x: 10,
          y: 28,
          width: 40,
          height: 10,
          rotation: 0,
          zIndex: 3,
          properties: JSON.stringify({
            format: 'EAN13',
            showText: true,
            height: 10
          })
        }
      ]
    }
  },
  {
    id: 'preset-complete',
    name: 'Complet',
    description: 'Nom, catégorie, prix, EAN-13 et QR code',
    category: 'complete',
    template: {
      name: 'Complet (copie)',
      description: 'Template complet avec tous les éléments',
      width: 60,
      height: 40,
      unit: 'mm',
      backgroundColor: '#FFF8F0',
      borderWidth: 1,
      borderColor: '#DDDDDD',
      borderRadius: 2,
      elements: [
        {
          id: 'name-top',
          type: 'text',
          variableName: 'nom',
          x: 3,
          y: 3,
          width: 35,
          height: 8,
          rotation: 0,
          zIndex: 1,
          properties: JSON.stringify({
            fontSize: 10,
            fontFamily: 'helvetica',
            fontStyle: 'bold',
            color: '#000000',
            align: 'left',
            verticalAlign: 'middle'
          })
        },
        {
          id: 'category',
          type: 'text',
          variableName: 'categorie',
          x: 3,
          y: 11,
          width: 35,
          height: 6,
          rotation: 0,
          zIndex: 2,
          properties: JSON.stringify({
            fontSize: 8,
            fontFamily: 'helvetica',
            fontStyle: 'normal',
            color: '#888888',
            align: 'left',
            verticalAlign: 'middle'
          })
        },
        {
          id: 'price-right',
          type: 'text',
          variableName: 'prix',
          x: 40,
          y: 5,
          width: 17,
          height: 10,
          rotation: 0,
          zIndex: 3,
          properties: JSON.stringify({
            fontSize: 12,
            fontFamily: 'helvetica',
            fontStyle: 'bold',
            color: '#2E7D32',
            align: 'right',
            verticalAlign: 'middle',
            suffix: ' €'
          })
        },
        {
          id: 'barcode-center',
          type: 'barcode',
          variableName: 'ean',
          x: 5,
          y: 22,
          width: 30,
          height: 10,
          rotation: 0,
          zIndex: 4,
          properties: JSON.stringify({
            format: 'EAN13',
            showText: true,
            height: 10
          })
        },
        {
          id: 'qrcode-right',
          type: 'qrcode',
          variableName: 'url',
          x: 40,
          y: 20,
          width: 15,
          height: 15,
          rotation: 0,
          zIndex: 5,
          properties: JSON.stringify({
            size: 15,
            color: '#000000',
            backgroundColor: '#FFFFFF'
          })
        }
      ]
    }
  }
];

export const getPresetTemplateById = (id: string): PresetTemplate | undefined => {
  return presetTemplates.find(t => t.id === id);
};

export const getPresetTemplatesByCategory = (category: PresetTemplate['category']): PresetTemplate[] => {
  return presetTemplates.filter(t => t.category === category);
};
