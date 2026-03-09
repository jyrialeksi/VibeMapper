/**
 * Wrap data in an MCP text content response.
 */
export function textResponse(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}
