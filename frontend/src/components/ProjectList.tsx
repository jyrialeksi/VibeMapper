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
      <div className="text-center py-12 text-[#7A7A9A]">
        No projects yet. Create one to get started.
      </div>
    );
  }
  if (projects.length === 0) return null;

  return (
    <>
      <h2 className="text-sm font-medium text-[#7A7A9A] mb-2 flex items-center gap-1.5">
        {title === 'Shared with me' && <Users size={14} />}
        {title}
      </h2>
      <div className="space-y-2">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onSelect(project.id)}
            className="bg-white/85 dark:bg-[#0F0F1E]/85 backdrop-blur-xl border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] rounded-lg px-4 py-3 cursor-pointer hover:border-[#C6FF4D]/40 dark:hover:border-[#C6FF4D]/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#080810] dark:text-[#F0EEFF]">{project.name}</span>
              {project.role && project.role !== 'owner' && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#7B2FFF]/10 dark:bg-[#7B2FFF]/20 text-[#7B2FFF] dark:text-[#C6FF4D]">
                  {project.role}
                </span>
              )}
            </div>
            {project.description && (
              <div className="text-sm text-[#7A7A9A]">{project.description}</div>
            )}
            <div className="text-xs text-[#7A7A9A]/70 mt-1">
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
      <div className="min-h-screen bg-[#F0EEFF] dark:bg-[#080810] flex items-center justify-center">
        <div className="text-[#7A7A9A]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EEFF] dark:bg-[#080810]">
      {/* Top-right controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {authEnabled && user && (
          <div className="flex items-center gap-2 bg-white/85 dark:bg-[#0F0F1E]/85 backdrop-blur-xl border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] rounded-lg px-3 py-1.5 shadow-sm">
            {user.picture ? (
              <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#7B2FFF] flex items-center justify-center text-white text-xs font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-[#080810]/80 dark:text-[#F0EEFF]/80">{user.name}</span>
            <button
              onClick={logout}
              className="p-1 rounded text-[#7A7A9A] hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white/85 dark:bg-[#0F0F1E]/85 backdrop-blur-xl border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] shadow-sm text-[#080810]/70 dark:text-[#F0EEFF]/70 hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10 transition-colors duration-150"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div className="max-w-2xl mx-auto pt-16 px-4">
        <h1 className="font-display text-5xl text-[#080810] dark:text-[#F0EEFF] mb-2 tracking-wide">VIBEMAPPER</h1>
        <p className="text-[#7A7A9A] mb-8">Create and manage user story maps with AI assistance</p>

        {/* Create new project */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="New project name..."
            className="flex-1 border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2FFF]/20 bg-white dark:bg-[#16162A] dark:text-[#F0EEFF] dark:placeholder:text-[#7A7A9A]"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="btn-primary px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Create
          </button>
        </div>

        {/* Settings status card */}
        <button
          onClick={() => navigate('/settings')}
          className="w-full mb-6 bg-white/85 dark:bg-[#0F0F1E]/85 backdrop-blur-xl border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] rounded-xl px-4 py-3 hover:border-[#C6FF4D]/40 hover:shadow-sm transition-all text-left cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-[#7A7A9A]" />
              <span className="text-sm font-medium text-[#080810]/80 dark:text-[#F0EEFF]/80">Settings</span>
            </div>
            <ChevronRight size={16} className="text-[#7A7A9A]" />
          </div>
          <div className="flex items-center gap-4 mt-1.5 ml-6">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-[#00F5D4]' : 'bg-[#C6FF4D]'}`} />
              <span className="text-xs text-[#7A7A9A]">
                {hasApiKey ? 'AI Ready' : 'API Key Required'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${hasMcpToken ? 'bg-[#00F5D4]' : 'bg-[#7A7A9A]/40'}`} />
              <span className="text-xs text-[#7A7A9A]">
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
