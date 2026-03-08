import { useState } from 'react';
import { useAI } from '../../hooks/useAI';
import { useMapStore } from '../../store/useMapStore';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles, Send, Loader2, X } from 'lucide-react';

export function MobileAIButton() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const { models, selectedModel, setSelectedModel, loading, error, generate } = useAI();
  const hasNodes = useMapStore((s) => s.nodes.length > 0);
  const { hasApiKey } = useAuth();

  if (!hasApiKey) return null;

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generate(prompt);
    setPrompt('');
    setOpen(false);
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="absolute bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center active:bg-blue-700 transition-colors duration-150"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Bottom sheet */}
      {open && (
        <div className="absolute bottom-0 left-0 right-0 z-50 animate-slide-up flex justify-center">
          <div
            className="w-full max-w-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-t-2xl shadow-lg border-t border-x border-gray-200/50 dark:border-gray-700/50 px-4 pt-3"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {/* Drag handle + close */}
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                <Sparkles size={15} className="text-blue-500" />
                AI {hasNodes ? 'Edit' : 'Generate'}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="text-xs text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/40 px-2 py-1 rounded-lg mb-2">
                {error}
              </div>
            )}

            {/* Model selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 px-3 py-2.5 text-sm dark:text-gray-100 mb-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors duration-150"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            {/* Prompt input */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={hasNodes ? 'Describe changes to your story map...' : 'Describe your product or feature...'}
              className="w-full rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 px-3 py-2.5 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors duration-150 placeholder:text-gray-400 resize-none"
              rows={3}
              disabled={loading}
            />

            {/* Send button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full mt-2 bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {hasNodes ? 'Editing...' : 'Generating...'}
                </>
              ) : hasNodes ? (
                <>
                  <Send size={16} />
                  Edit Map
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
