import { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import type { PDFOptions, LabelLayout } from '../types';

interface LayoutPreset {
  id: string;
  name: string;
  templateId: string;
  pageSize: string;
  orientation: string;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  labelsPerRow: number;
  labelsPerColumn: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  isDefault: boolean;
}

interface LayoutPresetManagerProps {
  templateId: string;
  pdfOptions: PDFOptions;
  labelLayout: LabelLayout;
  onLoadPreset: (pdfOptions: PDFOptions, labelLayout: LabelLayout) => void;
}

export function LayoutPresetManager({
  templateId,
  pdfOptions,
  labelLayout,
  onLoadPreset,
}: LayoutPresetManagerProps) {
  const [presets, setPresets] = useState<LayoutPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, [templateId]);

  const loadPresets = async () => {
    try {
      const data = await dbService.getLayoutPresets(templateId);
      setPresets(data);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;

    setIsLoading(true);
    try {
      await dbService.createLayoutPreset({
        name: presetName,
        templateId,
        pageSize: pdfOptions.pageSize,
        orientation: pdfOptions.orientation,
        marginTop: pdfOptions.margins.top,
        marginRight: pdfOptions.margins.right,
        marginBottom: pdfOptions.margins.bottom,
        marginLeft: pdfOptions.margins.left,
        labelsPerRow: labelLayout.labelsPerRow,
        labelsPerColumn: labelLayout.labelsPerColumn,
        horizontalSpacing: labelLayout.horizontalSpacing,
        verticalSpacing: labelLayout.verticalSpacing,
        isDefault,
      });
      
      await loadPresets();
      setShowSaveModal(false);
      setPresetName('');
      setIsDefault(false);
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
    setIsLoading(false);
  };

  const handleLoadPreset = (preset: LayoutPreset) => {
    onLoadPreset(
      {
        pageSize: preset.pageSize as 'A4' | 'A5' | 'Letter',
        orientation: preset.orientation as 'portrait' | 'landscape',
        margins: {
          top: preset.marginTop,
          right: preset.marginRight,
          bottom: preset.marginBottom,
          left: preset.marginLeft,
        },
      },
      {
        labelsPerRow: preset.labelsPerRow,
        labelsPerColumn: preset.labelsPerColumn,
        labelsPerPage: preset.labelsPerRow * preset.labelsPerColumn,
        horizontalSpacing: preset.horizontalSpacing,
        verticalSpacing: preset.verticalSpacing,
      }
    );
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm('Supprimer ce preset ?')) return;
    
    try {
      await dbService.deleteLayoutPreset(id);
      await loadPresets();
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-text-primary">Presets de mise en page</h3>
        <button
          onClick={() => setShowSaveModal(true)}
          className="text-sm text-brand-600 hover:text-brand-800"
        >
          + Sauvegarder l'actuel
        </button>
      </div>

      {presets.length === 0 ? (
        <p className="text-sm text-text-muted">Aucun preset sauvegardé</p>
      ) : (
        <div className="space-y-2">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className={`flex items-center justify-between p-2 rounded border ${
                preset.isDefault ? 'bg-brand-50 border-brand-200' : 'bg-white border-border'
              }`}
            >
              <button
                onClick={() => handleLoadPreset(preset)}
                className="flex-1 text-left"
              >
                <div className="font-medium text-sm">{preset.name}</div>
                <div className="text-xs text-text-muted">
                  {preset.pageSize} {preset.orientation} • 
                  {preset.labelsPerRow}×{preset.labelsPerColumn} • 
                  Espacement: {preset.horizontalSpacing}mm/{preset.verticalSpacing}mm
                </div>
              </button>
              <div className="flex items-center gap-2">
                {preset.isDefault && (
                  <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded">
                    Défaut
                  </span>
                )}
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Sauvegarder le preset</h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Nom du preset"
              className="w-full px-3 py-2 border rounded mb-3"
              autoFocus
            />
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <span className="text-sm">Définir comme preset par défaut</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2 bg-surface-raised rounded hover:bg-surface"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim() || isLoading}
                className="flex-1 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50"
              >
                {isLoading ? '...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
