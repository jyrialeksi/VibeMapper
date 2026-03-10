export const availableModels = [
  // ── Anthropic ───────────────────────────────────────────────
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
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude 4.5 Sonnet',
    provider: 'Anthropic',
    isFree: false,
  },

  // ── OpenAI ──────────────────────────────────────────────────
  {
    id: 'openai/gpt-5.2',
    name: 'GPT-5.2',
    provider: 'OpenAI',
    isFree: false,
  },
  {
    id: 'openai/gpt-5.1',
    name: 'GPT-5.1',
    provider: 'OpenAI',
    isFree: false,
  },
  {
    id: 'openai/gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'OpenAI',
    isFree: false,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    isFree: false,
  },

  // ── Google ──────────────────────────────────────────────────
  {
    id: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'Google',
    isFree: false,
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    isFree: false,
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    isFree: false,
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    isFree: false,
  },

  // ── DeepSeek ────────────────────────────────────────────────
  {
    id: 'deepseek/deepseek-v3.2',
    name: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    isFree: false,
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    isFree: false,
  },

  // ── xAI ─────────────────────────────────────────────────────
  {
    id: 'x-ai/grok-code-fast-1',
    name: 'Grok Code Fast',
    provider: 'xAI',
    isFree: false,
  },
  {
    id: 'x-ai/grok-4.1-fast',
    name: 'Grok 4.1 Fast',
    provider: 'xAI',
    isFree: false,
  },

  // ── Qwen ────────────────────────────────────────────────────
  {
    id: 'qwen/qwen3-coder',
    name: 'Qwen3 Coder',
    provider: 'Qwen',
    isFree: false,
  },

  // ── Mistral ─────────────────────────────────────────────────
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct',
    name: 'Mistral Small 3.1',
    provider: 'Mistral',
    isFree: false,
  },

  // ── Meta ────────────────────────────────────────────────────
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    isFree: false,
  },

  // ═══════════════════════════════════════════════════════════
  // FREE MODELS (OpenRouter subsidized, rate-limited ~20 req/min)
  // Verified against openrouter.ai as of 2026-03-10
  // ═══════════════════════════════════════════════════════════

  {
    id: 'google/gemini-2.5-flash:free',
    name: 'Gemini 2.5 Flash (Free)',
    provider: 'Google',
    isFree: true,
  },
  {
    id: 'google/gemini-2.5-flash-lite:free',
    name: 'Gemini 2.5 Flash Lite (Free)',
    provider: 'Google',
    isFree: true,
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B (Free)',
    provider: 'Google',
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-v3.2:free',
    name: 'DeepSeek V3.2 (Free)',
    provider: 'DeepSeek',
    isFree: true,
  },
  {
    id: 'openai/gpt-4.1-mini:free',
    name: 'GPT-4.1 Mini (Free)',
    provider: 'OpenAI',
    isFree: true,
  },
  {
    id: 'openai/gpt-oss-20b:free',
    name: 'GPT Open-Source 20B (Free)',
    provider: 'OpenAI',
    isFree: true,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (Free)',
    provider: 'Meta',
    isFree: true,
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct:free',
    name: 'Mistral Small 3.1 (Free)',
    provider: 'Mistral',
    isFree: true,
  },
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    name: 'Nemotron 3 Nano 30B (Free)',
    provider: 'NVIDIA',
    isFree: true,
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b:free',
    name: 'Hermes 3 Llama 405B (Free)',
    provider: 'Nous Research',
    isFree: true,
  },
  {
    id: 'stepfun/step-3.5-flash:free',
    name: 'Step 3.5 Flash (Free)',
    provider: 'StepFun',
    isFree: true,
  },
];

// Default models shown in canvas for new users (when enabled_models is NULL)
export const defaultEnabledModelIds = [
  'anthropic/claude-sonnet-4.6',
  'anthropic/claude-opus-4.6',
  'deepseek/deepseek-v3.2',
  'google/gemini-3-flash-preview',
  'meta-llama/llama-3.3-70b-instruct',
  'openai/gpt-5.2',
  // Popular free models
  'google/gemini-2.5-flash:free',
  'deepseek/deepseek-v3.2:free',
  'openai/gpt-4.1-mini:free',
];
