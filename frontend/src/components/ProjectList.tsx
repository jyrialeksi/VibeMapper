import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Project } from '../types';
import { Moon, Sun, LogOut, Users, Settings, ChevronRight } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

function ProjectSection({
  title,
  projects,
  onSelect,
}: {
  title: string;
  projects: Project[];
  onSelect: (id: string) => void;
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
            className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all"
          >
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
        ))}
      </div>
    </>
  );
}

export function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { user, authEnabled, logout, hasApiKey, hasMcpToken } = useAuth();

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

  const handleSelect = useCallback((id: string) => {
    navigate(`/project/${id}`);
  }, [navigate]);

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

        {/* Settings status card */}
        <button
          onClick={() => navigate('/settings')}
          className="w-full mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-3 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all text-left cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</span>
            </div>
            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
          </div>
          <div className="flex items-center gap-4 mt-1.5 ml-6">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {hasApiKey ? 'AI Ready' : 'API Key Required'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${hasMcpToken ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {hasMcpToken ? 'MCP Connected' : 'MCP Not Set Up'}
              </span>
            </div>
          </div>
        </button>

        {/* Owned projects */}
        <ProjectSection
          title="My Projects"
          projects={ownedProjects}
          onSelect={handleSelect}
        />

        {/* Shared projects */}
        {sharedProjects.length > 0 && (
          <div className="mt-8">
            <ProjectSection
              title="Shared with me"
              projects={sharedProjects}
              onSelect={handleSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
