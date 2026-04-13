import { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useEditorStore } from '../stores/editorStore';
import { Sidebar } from '../components/Sidebar';
import { LabelCanvas } from '../components/canvas/LabelCanvas';
import { Toolbar } from '../components/Toolbar';
import { AlignmentToolbar } from '../components/canvas/AlignmentToolbar';
import { Home, ArrowRight, Settings } from 'lucide-react';

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
        {/* Navigation Header avec breadcrumb */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link 
              to="/" 
              className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors"
              title="Retour au Dashboard"
            >
              <Home size={16} />
              <span>Dashboard</span>
            </Link>
            <span className="text-gray-400">/</span>
            <span className="font-medium text-gray-900 truncate max-w-xs" title={template?.name}>
              {template?.name || 'Template'}
            </span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link 
              to={`/mapping/${id}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Settings size={16} />
              Configurer CSV
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        
        <AlignmentToolbar />
        <LabelCanvas />
      </div>
      <Toolbar />
    </div>
  );
}
