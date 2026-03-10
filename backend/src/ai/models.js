export const availableModels = [
  // ── Anthropic ───────────────────────────────────────────────
  {
    id: 'anthropic/claude-4.6-sonnet-20260217',
    name: 'Claude 4.6 Sonnet',
    provider: 'Anthropic',
    isFree: false,
  },
  {
    id: 'anthropic/claude-4.6-opus-20260205',
    name: 'Claude 4.6 Opus',
    provider: 'Anthropic',
    isFree: false,
  },
  {
    id: 'anthropic/claude-4.5-sonnet-20250929',
    name: 'Claude 4.5 Sonnet',
    provider: 'Anthropic',
    isFree: false,
  },

  // ── OpenAI ──────────────────────────────────────────────────
  {
    id: 'openai/gpt-5.2-20251211',
    name: 'GPT-5.2',
    provider: 'OpenAI',
    isFree: false,
  },
  {
    id: 'openai/gpt-5.1-20251113',
    name: 'GPT-5.1',
    provider: 'OpenAI',
    isFree: false,
  },
  {
    id: 'openai/gpt-4.1-mini-2025-04-14',
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
    id: 'google/gemini-3-flash-preview-20251217',
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
    id: 'deepseek/deepseek-v3.2-20251201',
    name: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    isFree: false,
  },
  {
    id: 'deepseek/deepseek-r1-0528',
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
  // FREE MODELS (OpenRouter subsidized, rate-limited)
  // ═══════════════════════════════════════════════════════════

  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder (Free)',
    provider: 'Qwen',
    isFree: true,
  },
  {
    id: 'stepfun/step-3.5-flash:free',
    name: 'Step 3.5 Flash (Free)',
    provider: 'StepFun',
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-v3.2-20251201:free',
    name: 'DeepSeek V3.2 (Free)',
    provider: 'DeepSeek',
    isFree: true,
  },
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
    id: 'google/gemini-3-flash-preview-20251217:free',
    name: 'Gemini 3 Flash (Free)',
    provider: 'Google',
    isFree: true,
  },
  {
    id: 'openai/gpt-4o-mini:free',
    name: 'GPT-4o Mini (Free)',
    provider: 'OpenAI',
    isFree: true,
  },
  {
    id: 'openai/gpt-4.1-mini-2025-04-14:free',
    name: 'GPT-4.1 Mini (Free)',
    provider: 'OpenAI',
    isFree: true,
  },
  {
    id: 'openai/gpt-5-nano-2025-08-07:free',
    name: 'GPT-5 Nano (Free)',
    provider: 'OpenAI',
    isFree: true,
  },
  {
    id: 'openai/gpt-5-mini-2025-08-07:free',
    name: 'GPT-5 Mini (Free)',
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
    id: 'openai/gpt-oss-120b:free',
    name: 'GPT Open-Source 120B (Free)',
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
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B (Free)',
    provider: 'Google',
    isFree: true,
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b:free',
    name: 'Hermes 3 Llama 405B (Free)',
    provider: 'Nous Research',
    isFree: true,
  },
  {
    id: 'x-ai/grok-4.1-fast:free',
    name: 'Grok 4.1 Fast (Free)',
    provider: 'xAI',
    isFree: true,
  },
  {
    id: 'anthropic/claude-4.6-opus-20260205:free',
    name: 'Claude 4.6 Opus (Free)',
    provider: 'Anthropic',
    isFree: true,
  },
];
