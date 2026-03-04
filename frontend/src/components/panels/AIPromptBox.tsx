import { useState } from 'react';
import { useAI } from '../../hooks/useAI';

export function AIPromptBox() {
  const [prompt, setPrompt] = useState('');
  const { models, selectedModel, setSelectedModel, loading, error, generate, arrange } = useAI();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generate(prompt);
    setPrompt('');
  };

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mb-2">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white min-w-[160px]"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Describe your product or feature..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
          <button
            onClick={arrange}
            disabled={loading}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 border border-gray-300 whitespace-nowrap"
          >
            Auto-arrange
          </button>
        </div>
      </div>
    </div>
  );
}
