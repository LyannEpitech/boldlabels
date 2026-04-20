import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { MappingPage } from './pages/MappingPage';
import { GeneratePage } from './pages/GeneratePage';
import { ToastContainer } from './components/ui/Toast';
import { useToastStore } from './stores/toastStore';

function App() {
  const { toasts, removeToast } = useToastStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="/mapping/:id" element={<MappingPage />} />
        <Route path="/generate/:id" element={<GeneratePage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </BrowserRouter>
  );
}

export default App;
