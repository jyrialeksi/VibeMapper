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
      <div className="h-10 bg-[#F0EEFF] dark:bg-[#0F0F1E] border-b border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] flex items-center px-3 shrink-0 z-50">
        <button
          onClick={() => {
            setProjectRole('owner');
            navigate('/');
          }}
          className="text-sm text-[#7A7A9A] hover:text-[#080810] dark:hover:text-[#F0EEFF] mr-3 flex items-center gap-1 transition-colors duration-150"
        >
          <ArrowLeft size={14} />
          Projects
        </button>
        <span className="text-sm font-medium text-[#080810]/80 dark:text-[#F0EEFF]/80">Story Map</span>
        {projectRole === 'viewer' && (
          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-[#7B2FFF]/10 dark:bg-[#7B2FFF]/20 text-[#7B2FFF] dark:text-[#C6FF4D]">
            View only
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {authEnabled && projectRole === 'owner' && (
            <button
              onClick={() => setSharePanelOpen(true)}
              className="p-1.5 rounded-lg text-[#7A7A9A] hover:bg-[#7B2FFF]/10 dark:hover:bg-[#7B2FFF]/20 transition-colors duration-150"
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
                <div className="w-5 h-5 rounded-full bg-[#7B2FFF] flex items-center justify-center text-white text-[10px] font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-[#7A7A9A] hover:bg-[#7B2FFF]/10 dark:hover:bg-[#7B2FFF]/20 transition-colors duration-150"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </>
          )}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-[#7A7A9A] hover:bg-[#7B2FFF]/10 dark:hover:bg-[#7B2FFF]/20 transition-colors duration-150"
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
