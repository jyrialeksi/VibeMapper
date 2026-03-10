import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Key, Check, Trash2, ExternalLink, LogOut, Cpu, Sparkles } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { McpServerPanel } from './panels/McpServerPanel';
import type { AIModel } from '../types';

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, authEnabled, logout, hasApiKey, refreshApiKeyStatus } = useAuth();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyMsg, setApiKeyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [apiKeySaving, setApiKeySaving] = useState(false);

  // Model selection state
  const [models, setModels] = useState<AIModel[]>([]);
  const [preferredModel, setPreferredModel] = useState<string | null>(null);
  const [modelSaving, setModelSaving] = useState(false);
  const [modelMsg, setModelMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modelFilter, setModelFilter] = useState<'all' | 'free' | 'paid'>('all');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.getModels(),
      api.getPreferredModel().catch(() => ({ preferredModel: null })),
    ]).then(([fetchedModels, prefResult]) => {
      if (cancelled) return;
      setModels(fetchedModels);
      setPreferredModel(prefResult.preferredModel);
    });
    return () => { cancelled = true; };
  }, []);

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

  const handleSelectModel = async (modelId: string) => {
    setModelSaving(true);
    setPreferredModel(modelId);
    try {
      await api.setPreferredModel(modelId);
      setModelMsg({ type: 'success', text: 'Default model updated' });
      setTimeout(() => setModelMsg(null), 3000);
    } catch (err) {
      setModelMsg({ type: 'error', text: (err as Error).message });
      setTimeout(() => setModelMsg(null), 3000);
    } finally {
      setModelSaving(false);
    }
  };

  const filteredModels = models.filter(m => {
    if (modelFilter === 'free') return m.isFree;
    if (modelFilter === 'paid') return !m.isFree;
    return true;
  });

  // Group models by provider
  const groupedModels = filteredModels.reduce<Record<string, AIModel[]>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  // Sort providers: put free-heavy providers at the end when showing "all"
  const providerOrder = Object.keys(groupedModels).sort((a, b) => a.localeCompare(b));

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

      <div className="max-w-2xl mx-auto pt-16 px-4 pb-16">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-[#7A7A9A] hover:text-[#080810] dark:hover:text-[#F0EEFF] mb-6 flex items-center gap-1 transition-colors duration-150"
        >
          <ArrowLeft size={14} />
          Back to Projects
        </button>

        <h1 className="font-display text-4xl text-[#080810] dark:text-[#F0EEFF] mb-2 tracking-wide">SETTINGS</h1>
        <p className="text-[#7A7A9A] mb-8">Configure API keys, model preferences, and integrations</p>

        {/* API Key settings */}
        <div className="mb-8 bg-white/85 dark:bg-[#0F0F1E]/85 backdrop-blur-xl border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Key size={16} className="text-[#7A7A9A]" />
            <h3 className="text-sm font-medium text-[#080810]/80 dark:text-[#F0EEFF]/80">OpenRouter API Key</h3>
            {hasApiKey && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#00F5D4]/15 text-[#00F5D4] flex items-center gap-1">
                <Check size={12} />
                Configured
              </span>
            )}
          </div>
          {hasApiKey ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#7A7A9A] font-mono-brand">••••••••</span>
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
                className="flex-1 border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] rounded-lg px-3 py-2 text-sm font-mono-brand focus:outline-none focus:ring-2 focus:ring-[#7B2FFF]/20 bg-white dark:bg-[#16162A] dark:text-[#F0EEFF] dark:placeholder:text-[#7A7A9A]"
              />
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput.trim() || apiKeySaving}
                className="btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Save
              </button>
            </div>
          )}
          {apiKeyMsg && (
            <p className={`text-xs mt-2 ${apiKeyMsg.type === 'success' ? 'text-[#00F5D4]' : 'text-red-600 dark:text-red-400'}`}>
              {apiKeyMsg.text}
            </p>
          )}
          {!hasApiKey && (
            <p className="text-xs text-[#7A7A9A] mt-2">
              Required for AI features.{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-[#7B2FFF] dark:text-[#C6FF4D] hover:underline inline-flex items-center gap-0.5">
                Get a key <ExternalLink size={10} />
              </a>
            </p>
          )}
        </div>

        {/* Model Selection */}
        <div className="mb-8 bg-white/85 dark:bg-[#0F0F1E]/85 backdrop-blur-xl border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={16} className="text-[#7A7A9A]" />
            <h3 className="text-sm font-medium text-[#080810]/80 dark:text-[#F0EEFF]/80">Default AI Model</h3>
          </div>
          <p className="text-xs text-[#7A7A9A] mb-3">
            Choose which model to use by default. You can still switch models per-request in the AI prompt.
          </p>

          {modelMsg && (
            <p className={`text-xs mb-2 ${modelMsg.type === 'success' ? 'text-[#00F5D4]' : 'text-red-600 dark:text-red-400'}`}>
              {modelMsg.text}
            </p>
          )}

          {/* Filter tabs */}
          <div className="flex gap-1 mb-3">
            {(['all', 'free', 'paid'] as const).map(f => (
              <button
                key={f}
                onClick={() => setModelFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-150 ${
                  modelFilter === f
                    ? 'bg-[#7B2FFF]/10 text-[#7B2FFF] dark:bg-[#7B2FFF]/20 dark:text-[#C6FF4D]'
                    : 'text-[#7A7A9A] hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10'
                }`}
              >
                {f === 'all' ? 'All Models' : f === 'free' ? 'Free' : 'Paid'}
              </button>
            ))}
          </div>

          {/* Model list grouped by provider */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {providerOrder.map(provider => (
              <div key={provider}>
                <div className="text-xs font-medium text-[#7A7A9A] uppercase tracking-wider mb-1.5 sticky top-0 bg-white/85 dark:bg-[#0F0F1E]/85 py-0.5">
                  {provider}
                </div>
                <div className="space-y-1">
                  {groupedModels[provider].map(m => {
                    const isSelected = preferredModel === m.id || (!preferredModel && models[0]?.id === m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleSelectModel(m.id)}
                        disabled={modelSaving}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 flex items-center gap-2 ${
                          isSelected
                            ? 'bg-[#7B2FFF]/10 border border-[#7B2FFF]/30 dark:bg-[#7B2FFF]/20 dark:border-[#C6FF4D]/30'
                            : 'border border-transparent hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`truncate ${isSelected ? 'text-[#7B2FFF] dark:text-[#C6FF4D] font-medium' : 'text-[#080810]/80 dark:text-[#F0EEFF]/80'}`}>
                              {m.name}
                            </span>
                            {m.isFree && (
                              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-[#00F5D4]/15 text-[#00F5D4] font-medium">
                                FREE
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check size={14} className="shrink-0 text-[#7B2FFF] dark:text-[#C6FF4D]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-[#7A7A9A] mt-3 flex items-center gap-1">
            <Sparkles size={10} />
            Free models are rate-limited (~20 req/min). Paid models require OpenRouter credits.
          </p>
        </div>

        {/* MCP Server */}
        <McpServerPanel />
      </div>
    </div>
  );
}
