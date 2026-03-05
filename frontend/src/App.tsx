import { useState, useEffect, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import { api } from './api/client';
import type { Project } from './types';
import { X, ArrowLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from './hooks/useTheme';

function ProjectList({ onSelect }: { onSelect: (id: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

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
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="max-w-2xl mx-auto pt-16 px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">User Story Mapper</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Create and manage user story maps with AI assistance</p>

        {/* Create new project */}
        <div className="flex gap-2 mb-8">
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

        {/* Project list */}
        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            No projects yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelect(project.id)}
                className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{project.name}</div>
                  {project.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">{project.description}</div>
                  )}
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Updated {new Date(project.updated_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(project.id, e)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-2"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  if (!projectId) {
    return <ProjectList onSelect={setProjectId} />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-3 shrink-0 z-50">
        <button
          onClick={() => setProjectId(null)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mr-3 flex items-center gap-1 transition-colors duration-150"
        >
          <ArrowLeft size={14} />
          Projects
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Story Map</span>
        <button
          onClick={toggleTheme}
          className="ml-auto p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
      {/* Canvas */}
      <div className="flex-1">
        <Canvas projectId={projectId} />
      </div>
    </div>
  );
}

export default App;
