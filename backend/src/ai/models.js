export const availableModels = [
  {
    id: 'anthropic/claude-sonnet-4.6',
    name: 'Claude 4.6 Sonnet',
    provider: 'Anthropic',
    isFree: false,
  },
  {
    id: 'anthropic/claude-opus-4.6',
    name: 'Claude 4.6 Opus',
    provider: 'Anthropic',
    isFree: false,
  },
  {
    id: 'openai/gpt-5.2',
    name: 'GPT-5.2',
    provider: 'OpenAI',
    isFree: false,
  },
  {
    id: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'Google',
    isFree: false,
  },
];

// Default model for all users
export const defaultModelId = 'anthropic/claude-sonnet-4.6';
