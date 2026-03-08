import { useState, useEffect, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import { LoginPage } from './components/LoginPage';
import { api } from './api/client';
import type { Project } from './types';
import { X, ArrowLeft, Moon, Sun, LogOut, Users, Share2, Key, Check, Trash2, ExternalLink } from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useMapStore } from './store/useMapStore';
import { SharePanel } from './components/panels/SharePanel';

function ProjectList({ onSelect }: { onSelect: (id: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { user, authEnabled, logout, hasApiKey, refreshApiKeyStatus } = useAuth();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyMsg, setApiKeyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [apiKeySaving, setApiKeySaving] = useState(false);

  const ownedProjects = projects.filter((p) => p.role === 'owner' || !p.role);
  const sharedProjects = projects.filter((p) => p.role && p.role !== 'owner');

  const loadProjects = useCallback(async () => {
    try {
      const data = await api.listProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const project = await api.createProject(newName.trim());
      setNewName('');
      setProjects((prev) => [project, ...prev]);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setApiKeySaving(true);
    try {
      await api.saveApiKey(apiKeyInput.trim());
      setApiKeyInput('');
      await refreshApiKeyStatus();
      setApiKeyMsg({ type: 'success', text: 'API key saved' });
      setTimeout(() => setApiKeyMsg(null), 3000);
    } catch (err) {
      setApiKeyMsg({ type: 'error', text: (err as Error).message });
      setTimeout(() => setApiKeyMsg(null), 3000);
    } finally {
      setApiKeySaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top-right controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {authEnabled && user && (
          <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-lg px-3 py-1.5 shadow-sm">
            {user.picture ? (
              <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-700 dark:text-gray-300">{user.name}</span>
            <button
              onClick={logout}
              className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div className="max-w-2xl mx-auto pt-16 px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">User Story Mapper</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Create and manage user story maps with AI assistance</p>

        {/* Create new project */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="New project name..."
            className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </div>

        {/* API Key settings */}
        <div className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Key size={16} className="text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">OpenRouter API Key</h3>
            {hasApiKey && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 flex items-center gap-1">
                <Check size={12} />
                Configured
              </span>
            )}
          </div>
          {hasApiKey ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">sk-or-...****</span>
              <button
                onClick={async () => {
                  try {
                    await api.deleteApiKey();
                    await refreshApiKeyStatus();
                    setApiKeyMsg({ type: 'success', text: 'API key removed' });
                    setTimeout(() => setApiKeyMsg(null), 3000);
                  } catch (err) {
                    setApiKeyMsg({ type: 'error', text: (err as Error).message });
                    setTimeout(() => setApiKeyMsg(null), 3000);
                  }
                }}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={12} />
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && apiKeyInput.trim()) {
                    e.preventDefault();
                    handleSaveApiKey();
                  }
                }}
                placeholder="sk-or-v1-..."
                className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput.trim() || apiKeySaving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          )}
          {apiKeyMsg && (
            <p className={`text-xs mt-2 ${apiKeyMsg.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {apiKeyMsg.text}
            </p>
          )}
          {!hasApiKey && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Required for AI features.{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 inline-flex items-center gap-0.5">
                Get a key <ExternalLink size={10} />
              </a>
            </p>
          )}
        </div>

        {/* Owned projects */}
        <ProjectSection
          title="My Projects"
          projects={ownedProjects}
          onSelect={onSelect}
          onDelete={handleDelete}
          showDelete
        />

        {/* Shared projects */}
        {sharedProjects.length > 0 && (
          <div className="mt-8">
            <ProjectSection
              title="Shared with me"
              projects={sharedProjects}
              onSelect={onSelect}
              onDelete={handleDelete}
              showDelete={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectSection({
  title,
  projects,
  onSelect,
  onDelete,
  showDelete,
}: {
  title: string;
  projects: Project[];
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  showDelete: boolean;
}) {
  if (projects.length === 0 && title === 'My Projects') {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        No projects yet. Create one to get started.
      </div>
    );
  }
  if (projects.length === 0) return null;

  return (
    <>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
        {title === 'Shared with me' && <Users size={14} />}
        {title}
      </h2>
      <div className="space-y-2">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onSelect(project.id)}
            className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all flex items-center justify-between group"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">{project.name}</span>
                {project.role && project.role !== 'owner' && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    {project.role}
                  </span>
                )}
              </div>
              {project.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400">{project.description}</div>
              )}
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {project.owner_name && <span>by {project.owner_name} &middot; </span>}
                Updated {new Date(project.updated_at).toLocaleString()}
              </div>
            </div>
            {showDelete && (
              <button
                onClick={(e) => onDelete(project.id, e)}
                className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-2"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function App() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isSharePanelOpen, setSharePanelOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, loading, authEnabled, logout } = useAuth();
  const setProjectRole = useMapStore((s) => s.setProjectRole);
  const projectRole = useMapStore((s) => s.projectRole);

  // Handle /share/:token URLs
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/share\/(.+)$/);
    if (match) {
      setShareToken(match[1]);
    }
  }, []);

  // Accept share token after login
  useEffect(() => {
    if (!shareToken || !user) return;
    api.acceptShareLink(shareToken)
      .then(({ projectId: pid }) => {
        setShareToken(null);
        window.history.replaceState(null, '', '/');
        setProjectId(pid);
      })
      .catch((err) => {
        console.error('Failed to accept share link:', err);
        setShareToken(null);
        window.history.replaceState(null, '', '/');
      });
  }, [shareToken, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (authEnabled && !user) {
    return <LoginPage />;
  }

  if (!projectId) {
    return <ProjectList onSelect={setProjectId} />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-3 shrink-0 z-50">
        <button
          onClick={() => {
            setProjectId(null);
            setProjectRole('owner');
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
        <Canvas projectId={projectId} />
      </div>
      {projectId && (
        <SharePanel
          projectId={projectId}
          isOpen={isSharePanelOpen}
          onClose={() => setSharePanelOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
