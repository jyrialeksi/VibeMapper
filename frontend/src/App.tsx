import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { ProjectList } from './components/ProjectList';
import { SettingsPage } from './components/SettingsPage';
import { ProjectPage } from './pages/ProjectPage';
import { ShareAcceptPage } from './pages/ShareAcceptPage';
import { useAuth } from './hooks/useAuth';

function AppRoutes() {
  const { user, loading, error, authEnabled } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">Authentication Error</div>
          <div className="text-gray-600 dark:text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (authEnabled && !user) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<ProjectList />} />
      <Route path="/project/:projectId" element={<ProjectPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/share/:shareToken" element={<ShareAcceptPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
