const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(model, messages, { jsonMode, temperature }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const body = {
    model,
    messages,
    temperature,
    max_tokens: 16384,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'User Story Mapper AI',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('Empty response from AI');

  return content;
}

function tryParseJson(content) {
  // Strip markdown code fences that some models wrap around JSON
  const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Some models return prose with embedded JSON — extract the first { ... } or [ ... ] block
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // fall through
      }
    }
    return null;
  }
}

export async function chatCompletion(model, messages, { jsonMode = true, temperature = 0.7, retries = 1 } = {}) {
  const content = await callOpenRouter(model, messages, { jsonMode, temperature });

  if (!jsonMode) return content;

  const parsed = tryParseJson(content);
  if (parsed !== null) return parsed;

  // JSON parse failed — retry with conversational correction
  if (retries > 0) {
    console.warn('AI returned non-JSON response, retrying with correction...');
    const correctionMessages = [
      ...messages,
      { role: 'assistant', content },
      { role: 'user', content: 'Your response was not valid JSON. Respond with ONLY a valid JSON object — no explanation, no markdown, no text before or after.' },
    ];
    return chatCompletion(model, correctionMessages, { jsonMode, temperature, retries: retries - 1 });
  }

  throw new Error('AI returned invalid JSON. Try a different model or rephrase your prompt.');
}
