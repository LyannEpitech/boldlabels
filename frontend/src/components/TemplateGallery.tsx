import React from 'react';
import { presetTemplates, type PresetTemplate } from '../data/presetTemplates';
import type { Template } from '../types';

interface TemplateGalleryProps {
  onSelectTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate, onClose }) => {
  const categories = {
    retail: 'Retail',
    price: 'Prix',
    complete: 'Complet'
  };

  const handleSelect = (preset: PresetTemplate) => {
    onSelectTemplate(preset.template);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Créer depuis un template</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Choisissez un template prédéfini pour démarrer rapidement
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {Object.entries(categories).map(([categoryKey, categoryLabel]) => {
            const templates = presetTemplates.filter(t => t.category === categoryKey);
            if (templates.length === 0) return null;

            return (
              <div key={categoryKey} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {categoryLabel}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      onClick={() => handleSelect(template)}
                      className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
                    >
                      {/* Thumbnail placeholder */}
                      <div className="bg-gray-100 rounded-md h-32 mb-3 flex items-center justify-center group-hover:bg-gray-50">
                        {template.thumbnail ? (
                          <img
                            src={template.thumbnail}
                            alt={template.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">
                            {template.template.width}×{template.template.height}mm
                          </div>
                        )}
                      </div>

                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {template.description}
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                        <span>{template.template.elements.length} éléments</span>
                        <span>•</span>
                        <span>{template.template.backgroundColor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Vous pourrez personnaliser le template après la création
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;
