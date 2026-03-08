import { useCallback, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, LogOut, Share2 } from 'lucide-react';
import { Canvas } from '../components/Canvas';
import { SharePanel } from '../components/panels/SharePanel';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useMapStore } from '../store/useMapStore';
import { api } from '../api/client';

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [isSharePanelOpen, setSharePanelOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, authEnabled, logout } = useAuth();
  const setProjectRole = useMapStore((s) => s.setProjectRole);
  const projectRole = useMapStore((s) => s.projectRole);

  const handleDeleteProject = useCallback(async () => {
    if (!projectId) return;
    try {
      await api.deleteProject(projectId);
      setProjectRole('owner');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  }, [projectId, setProjectRole, navigate]);

  if (!projectId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-3 shrink-0 z-50">
        <button
          onClick={() => {
            setProjectRole('owner');
            navigate('/');
          }}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mr-3 flex items-center gap-1 transition-colors duration-150"
        >
          <ArrowLeft size={14} />
          Projects
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Story Map</span>
        {projectRole === 'viewer' && (
          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            View only
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {authEnabled && projectRole === 'owner' && (
            <button
              onClick={() => setSharePanelOpen(true)}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
              title="Share project"
            >
              <Share2 size={14} />
            </button>
          )}
          {authEnabled && user && (
            <>
              {user.picture ? (
                <img src={user.picture} alt="" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </>
          )}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>
      {/* Canvas */}
      <div className="flex-1">
        <Canvas projectId={projectId} onDeleteProject={projectRole === 'owner' ? handleDeleteProject : undefined} />
      </div>
      <SharePanel
        projectId={projectId}
        isOpen={isSharePanelOpen}
        onClose={() => setSharePanelOpen(false)}
      />
    </div>
  );
}
