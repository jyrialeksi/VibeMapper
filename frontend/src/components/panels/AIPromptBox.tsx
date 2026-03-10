import { useState } from 'react';
import { useAI } from '../../hooks/useAI';
import { useMapStore } from '../../store/useMapStore';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles, Send, Loader2, KeyRound } from 'lucide-react';
import { AutoExpandTextarea } from '../ui/AutoExpandTextarea';
import { GLASS_PANEL, INPUT_BASE } from '../../styles/shared';

export function AIPromptBox() {
  const [prompt, setPrompt] = useState('');
  const { models, selectedModel, setSelectedModel, loading, error, generate } = useAI();
  const hasNodes = useMapStore((s) => s.nodes.length > 0);
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const { hasApiKey } = useAuth();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generate(prompt, selectedNodeId);
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
        <div className={`${GLASS_PANEL} rounded-2xl shadow-lg p-3`}>
          <div className="flex items-center gap-2 text-sm text-[#7A7A9A] justify-center py-1">
            <KeyRound size={15} />
            <span>AI features require an API key. Set your OpenRouter key on the projects page.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl">
      <div className={`${GLASS_PANEL} rounded-2xl shadow-lg p-3`}>
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/40 px-2 py-1 rounded-lg mb-2">
            {error}
          </div>
        )}
        <div className="flex items-end gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className={`${INPUT_BASE} py-2 min-w-[160px] self-end`}
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
            placeholder={hasNodes ? (selectedNodeId ? "Describe changes to this card..." : "Describe changes to your story map...") : "Describe your product or feature..."}
            className={`flex-1 ${INPUT_BASE} px-3 py-2 focus:outline-none placeholder:text-[#7A7A9A]`}
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors duration-150 flex items-center gap-1.5 self-end"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {hasNodes ? (selectedNodeId ? 'Editing Card...' : 'Editing...') : 'Generating...'}
              </>
            ) : hasNodes ? (
              selectedNodeId ? (
                <>
                  <Send size={15} />
                  Edit Card
                </>
              ) : (
                <>
                  <Send size={15} />
                  Edit Map
                </>
              )
            ) : (
              <>
                <Sparkles size={15} />
                Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
