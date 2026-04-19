import { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useEditorStore } from '../stores/editorStore';
import { Sidebar } from '../components/Sidebar';
import { LabelCanvas } from '../components/canvas/LabelCanvas';
import { Toolbar } from '../components/Toolbar';
import { AlignmentToolbar } from '../components/canvas/AlignmentToolbar';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import TemplateGallery from '../components/TemplateGallery';
import LivePreview from '../components/LivePreview';
import { PositionIndicator } from '../components/canvas/PositionIndicator';
import { Ruler } from '../components/canvas/Ruler';
import type { Template } from '../types';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { template, templates, loadTemplate, createTemplate, addGuide } = useEditorStore();
  const [showGallery, setShowGallery] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showPosition, setShowPosition] = useState(false);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Track mouse position for position indicator
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => setShowPosition(true);
    const handleMouseUp = () => setShowPosition(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (id && (!template || template.id !== id)) {
      loadTemplate(id);
    }
  }, [id, template, loadTemplate]);

  const handleSelectPreset = (presetTemplate: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Create new template from preset
    createTemplate(presetTemplate);
    setShowGallery(false);
  };

  if (!id) return <Navigate to="/" />;

  const exists = templates.some((t) => t.id === id);
  if (!exists) return <Navigate to="/" />;

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col relative">
        <AlignmentToolbar />

        {/* Barre de navigation améliorée */}
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="font-medium text-gray-900">{template?.name}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton Aperçu */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors ${
                showPreview
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Aperçu
            </button>

            {/* Bouton Templates */}
            <button
              onClick={() => setShowGallery(true)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 border border-gray-300 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Templates
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <Link
              to={`/mapping/${id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Configurer CSV →
            </Link>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 transition-all ${showPreview ? 'mr-96' : ''} relative flex flex-col overflow-hidden`}>
            <div className="flex-1 flex items-center justify-center overflow-auto p-8">
              {template && (
                <Ruler
                  width={template.width}
                  height={template.height}
                  scale={1}
                  onGuideAdd={addGuide}
                >
                  <LabelCanvas showSmartGuides />
                </Ruler>
              )}
              {!template && <LabelCanvas showSmartGuides />}
            </div>
            
            {/* Position Indicator */}
            <PositionIndicator
              x={mousePosition.x}
              y={mousePosition.y}
              visible={showPosition && !!template}
            />
          </div>

          {/* Panneau d'aperçu */}
          {template && (
            <LivePreview
              template={template}
              isOpen={showPreview}
              onClose={() => setShowPreview(false)}
            />
          )}
        </div>
      </div>
      <Toolbar />

      {/* Modal Gallery */}
      {showGallery && (
        <TemplateGallery
          onSelectTemplate={handleSelectPreset}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}
