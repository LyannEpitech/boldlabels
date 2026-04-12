import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useEditorStore } from '../stores/editorStore';
import { Sidebar } from '../components/Sidebar';
import { LabelCanvas } from '../components/canvas/LabelCanvas';
import { Toolbar } from '../components/Toolbar';
import { AlignmentToolbar } from '../components/canvas/AlignmentToolbar';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { template, templates, loadTemplate } = useEditorStore();

  useEffect(() => {
    if (id && (!template || template.id !== id)) {
      loadTemplate(id);
    }
  }, [id, template, loadTemplate]);

  if (!id) return <Navigate to="/" />;
  
  const exists = templates.some((t) => t.id === id);
  if (!exists) return <Navigate to="/" />;

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <AlignmentToolbar />
        <LabelCanvas />
      </div>
      <Toolbar />
    </div>
  );
}
