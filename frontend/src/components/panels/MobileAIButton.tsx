import { useAI } from '../../hooks/useAI';
import { useMapStore } from '../../store/useMapStore';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles, Send, Loader2, X } from 'lucide-react';
import { INPUT_BASE } from '../../styles/shared';

export function MobileAIButton() {
  const { models, selectedModel, setSelectedModel, loading, error, generate } = useAI();
  const hasNodes = useMapStore((s) => s.nodes.length > 0);
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const activePanel = useMapStore((s) => s.activePanel);
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const prompt = useMapStore((s) => s.aiPromptText);
  const setPrompt = useMapStore((s) => s.setAIPromptText);
  const { hasApiKey } = useAuth();

  if (!hasApiKey) return null;

  const open = activePanel === 'ai';
  const paidModels = models.filter(m => !m.isFree);
  const freeModels = models.filter(m => m.isFree);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const success = await generate(prompt, selectedNodeId);
    if (success) {
      setPrompt('');
      setActivePanel('none');
    }
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setActivePanel('ai')}
          className="absolute bottom-6 right-4 z-50 w-14 h-14 rounded-full btn-primary shadow-lg flex items-center justify-center active:bg-[#d4ff70] transition-colors duration-150"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Bottom sheet */}
      {open && (
        <div className="absolute bottom-0 left-0 right-0 z-50 animate-slide-up flex justify-center">
          <div
            className="w-full max-w-3xl bg-white/95 dark:bg-[#0F0F1E]/95 backdrop-blur-xl rounded-t-2xl shadow-lg border-t border-x border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] px-4 pt-3"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {/* Drag handle + close */}
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-1 bg-[#7A7A9A]/30 rounded-full" />
              <span className="text-sm font-semibold text-[#080810] dark:text-[#F0EEFF] flex items-center gap-1.5">
                <Sparkles size={15} className="text-[#C6FF4D]" />
                AI {hasNodes ? (selectedNodeId ? 'Edit Card' : 'Edit') : 'Generate'}
              </span>
              <button
                onClick={() => setActivePanel('none')}
                className="p-1 hover:bg-[#7B2FFF]/10 dark:hover:bg-[#7B2FFF]/20 rounded-md text-[#7A7A9A]"
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
              className={`w-full ${INPUT_BASE} px-3 py-2.5 mb-2`}
            >
              {paidModels.length > 0 && (
                <optgroup label="Paid Models">
                  {paidModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
              )}
              {freeModels.length > 0 && (
                <optgroup label="Free Models">
                  {freeModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
              )}
            </select>

            {/* Prompt input */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={hasNodes ? (selectedNodeId ? 'Describe changes to this card...' : 'Describe changes to your story map...') : 'Describe your product or feature...'}
              className={`w-full ${INPUT_BASE} px-3 py-2.5 focus:outline-none placeholder:text-[#7A7A9A] resize-none`}
              rows={3}
              disabled={loading}
            />

            {/* Send button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full mt-2 btn-primary px-4 py-3 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {hasNodes ? (selectedNodeId ? 'Editing Card...' : 'Editing...') : 'Generating...'}
                </>
              ) : hasNodes ? (
                selectedNodeId ? (
                  <>
                    <Send size={16} />
                    Edit Card
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Edit Map
                  </>
                )
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
