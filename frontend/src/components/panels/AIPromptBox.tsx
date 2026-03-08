import { useState } from 'react';
import { useAI } from '../../hooks/useAI';
import { useMapStore } from '../../store/useMapStore';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles, Send, Loader2, LayoutGrid, KeyRound } from 'lucide-react';
import { AutoExpandTextarea } from '../ui/AutoExpandTextarea';

export function AIPromptBox() {
  const [prompt, setPrompt] = useState('');
  const { models, selectedModel, setSelectedModel, loading, error, generate } = useAI();
  const hasNodes = useMapStore((s) => s.nodes.length > 0);
  const arrangeLocal = useMapStore((s) => s.arrangeLocal);
  const { hasApiKey } = useAuth();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generate(prompt);
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  if (!hasApiKey) {
    return (
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 justify-center py-1">
            <KeyRound size={15} />
            <span>AI features require an API key. Set your OpenRouter key on the projects page.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3">
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/40 px-2 py-1 rounded-lg mb-2">
            {error}
          </div>
        )}
        <div className="flex items-end gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 px-2 py-2 text-sm dark:text-gray-100 min-w-[160px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors duration-150 self-end"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <AutoExpandTextarea
            minRows={1}
            maxRows={10}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasNodes ? "Describe changes to your story map..." : "Describe your product or feature..."}
            className="flex-1 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 px-3 py-2 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors duration-150 placeholder:text-gray-400"
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors duration-150 flex items-center gap-1.5 self-end"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {hasNodes ? 'Editing...' : 'Generating...'}
              </>
            ) : hasNodes ? (
              <>
                <Send size={15} />
                Edit Map
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Generate
              </>
            )}
          </button>
          <button
            onClick={() => { console.log('[AIPromptBox] Auto-arrange clicked'); arrangeLocal(); }}
            disabled={loading || !hasNodes}
            className="bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100/80 dark:hover:bg-gray-700/80 disabled:opacity-50 border border-gray-200/50 dark:border-gray-700/50 whitespace-nowrap transition-colors duration-150 flex items-center gap-1.5 self-end"
          >
            <LayoutGrid size={15} />
            Auto-arrange
          </button>
        </div>
      </div>
    </div>
  );
}
