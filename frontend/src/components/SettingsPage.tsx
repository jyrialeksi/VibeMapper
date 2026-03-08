import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Key, Check, Trash2, ExternalLink, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { McpServerPanel } from './panels/McpServerPanel';

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, authEnabled, logout, hasApiKey, refreshApiKeyStatus } = useAuth();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyMsg, setApiKeyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [apiKeySaving, setApiKeySaving] = useState(false);

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
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 flex items-center gap-1 transition-colors duration-150"
        >
          <ArrowLeft size={14} />
          Back to Projects
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Configure API keys and integrations</p>

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
              <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">••••••••</span>
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
                placeholder="Enter your API key..."
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

        {/* MCP Server */}
        <McpServerPanel />
      </div>
    </div>
  );
}
