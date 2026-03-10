import { useState, useCallback } from 'react';
import { Sparkles, Loader2, KeyRound, ArrowRight, ShoppingCart, FileText, CheckSquare, Dumbbell } from 'lucide-react';
import { useAI } from '../hooks/useAI';
import { useAuth } from '../hooks/useAuth';
import { useIsMobile } from '../hooks/useIsMobile';
import { api } from '../api/client';
import { useMapStore } from '../store/useMapStore';
import { AutoExpandTextarea } from './ui/AutoExpandTextarea';
import { GLASS_PANEL, INPUT_BASE } from '../styles/shared';
import { exampleMaps } from '../data/exampleMaps';
import type { ExampleMap } from '../data/exampleMaps';

const EXAMPLE_ICONS = [ShoppingCart, FileText, CheckSquare, Dumbbell];

interface OnboardingViewProps {
  projectId: string;
  onComplete: () => void;
}

export function OnboardingView({ projectId, onComplete }: OnboardingViewProps) {
  const [prompt, setPrompt] = useState('');
  const [importing, setImporting] = useState<string | null>(null);
  const { models, selectedModel, setSelectedModel, loading, generate } = useAI();
  const { hasApiKey } = useAuth();
  const isMobile = useIsMobile();
  const loadCanvas = useMapStore((s) => s.loadCanvas);

  const paidModels = models.filter(m => !m.isFree);
  const freeModels = models.filter(m => m.isFree);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;
    generate(prompt);
    setPrompt('');
    onComplete();
  }, [prompt, generate, onComplete]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleImportExample = useCallback(async (example: ExampleMap) => {
    setImporting(example.name);
    try {
      await api.importCanvas(projectId, {
        nodes: example.nodes,
        edges: example.edges,
        viewport: example.viewport,
      });
      const state = await api.loadCanvas(projectId);
      loadCanvas(state.nodes, state.edges, state.viewport);
      onComplete();
    } catch (err) {
      console.error('Example import failed:', err);
      setImporting(null);
    }
  }, [projectId, loadCanvas, onComplete]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#F0EEFF] dark:bg-[#080810] overflow-y-auto">
      <div className={`w-full max-w-2xl mx-auto px-4 ${isMobile ? 'py-6' : 'py-12'}`}>
        {/* AI Generation Section */}
        <div className={`${GLASS_PANEL} rounded-2xl shadow-lg p-5 mb-6`}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-[#7B2FFF] dark:text-[#C6FF4D]" />
            <h2 className="text-base font-semibold text-[#080810] dark:text-[#F0EEFF]">
              Generate with AI
            </h2>
          </div>

          {!hasApiKey ? (
            <div className="flex items-center gap-2 text-sm text-[#7A7A9A] py-2">
              <KeyRound size={15} />
              <span>AI features require an API key. Set your OpenRouter key on the projects page.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AutoExpandTextarea
                minRows={2}
                maxRows={6}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your product or feature... e.g. 'A recipe sharing app where users can upload, rate, and save recipes'"
                className={`w-full ${INPUT_BASE} px-3 py-2 focus:outline-none placeholder:text-[#7A7A9A]`}
                disabled={loading}
              />
              <div className="flex items-center gap-2">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className={`${INPUT_BASE} py-2 min-w-[180px]`}
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
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors duration-150 flex items-center gap-1.5 ml-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Example Maps Section */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-[#7A7A9A] mb-3 px-1">
            Or start from an example
          </h2>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
            {exampleMaps.map((example, i) => {
              const Icon = EXAMPLE_ICONS[i];
              const storyCount = example.nodes.filter(n => n.data.cardType === 'story').length;
              const isImporting = importing === example.name;

              return (
                <button
                  key={example.name}
                  onClick={() => handleImportExample(example)}
                  disabled={!!importing}
                  className={`${GLASS_PANEL} rounded-xl p-4 text-left transition-all duration-150 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#7B2FFF]/10 dark:bg-[#C6FF4D]/10 flex items-center justify-center flex-shrink-0">
                      {isImporting ? (
                        <Loader2 size={18} className="animate-spin text-[#7B2FFF] dark:text-[#C6FF4D]" />
                      ) : (
                        <Icon size={18} className="text-[#7B2FFF] dark:text-[#C6FF4D]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#080810] dark:text-[#F0EEFF] group-hover:text-[#7B2FFF] dark:group-hover:text-[#C6FF4D] transition-colors">
                        {example.name}
                      </div>
                      <div className="text-xs text-[#7A7A9A] mt-0.5">
                        {example.description}
                      </div>
                      <div className="text-[10px] text-[#7A7A9A]/70 mt-1">
                        {example.nodes.length} nodes &middot; {storyCount} stories
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skip Button */}
        <div className="text-center">
          <button
            onClick={onComplete}
            disabled={!!importing}
            className="text-sm text-[#7A7A9A] hover:text-[#7B2FFF] dark:hover:text-[#C6FF4D] transition-colors duration-150 inline-flex items-center gap-1.5"
          >
            Skip and start with an empty canvas
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
