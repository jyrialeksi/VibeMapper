import { useState } from 'react';
import { Terminal, Copy, Check, ChevronDown, ChevronUp, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

const MCP_TOOLS = [
  { group: 'Project management', tools: [
    { name: 'list_projects', desc: 'List all story map projects' },
    { name: 'create_project', desc: 'Create a new empty project' },
    { name: 'get_project', desc: 'Get project details by ID' },
    { name: 'delete_project', desc: 'Delete a project and all its data' },
  ]},
  { group: 'Canvas', tools: [
    { name: 'get_story_map', desc: 'Read a project\'s story map' },
    { name: 'set_story_map', desc: 'Replace the entire canvas' },
  ]},
  { group: 'Node operations', tools: [
    { name: 'add_nodes', desc: 'Add nodes and edges to a map' },
    { name: 'update_nodes', desc: 'Update data on existing nodes' },
    { name: 'remove_nodes', desc: 'Remove nodes and connected edges' },
  ]},
  { group: 'Status', tools: [
    { name: 'update_card_status', desc: 'Set status on story cards' },
  ]},
  { group: 'High-level', tools: [
    { name: 'create_story_map', desc: 'Create project with full story map' },
  ]},
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
      title="Copy"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="relative group">
      <pre className="font-mono text-xs bg-gray-100 dark:bg-gray-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
        {children}
      </pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={children} />
      </div>
    </div>
  );
}

export function McpServerPanel() {
  const { hasMcpToken: hasToken, refreshMcpTokenStatus } = useAuth();
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'claude' | 'cursor'>('claude');

  const mcpUrl = `${window.location.origin}/mcp`;

  const handleGenerate = async () => {
    try {
      const { token } = await api.generateMcpToken();
      setRawToken(token);
      await refreshMcpTokenStatus();
    } catch (err) {
      console.error('Failed to generate token:', err);
    }
  };

  const handleRevoke = async () => {
    try {
      await api.revokeMcpToken();
      setRawToken(null);
      await refreshMcpTokenStatus();
    } catch (err) {
      console.error('Failed to revoke token:', err);
    }
  };

  return (
    <div className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Terminal size={16} className="text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">MCP Server</h3>
        {hasToken ? (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 flex items-center gap-1">
            <Check size={12} />
            Token Active
          </span>
        ) : (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            No Token
          </span>
        )}
      </div>

      {/* Token Management */}
      <div className="mb-4">
        {!hasToken && !rawToken && (
          <button
            onClick={handleGenerate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Generate Token
          </button>
        )}

        {rawToken && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <code className="font-mono text-xs text-green-800 dark:text-green-300 flex-1 break-all select-all">
                {rawToken}
              </code>
              <CopyButton text={rawToken} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle size={12} />
              Copy this token now — it won't be shown again
            </div>
          </div>
        )}

        {hasToken && !rawToken && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">mcp_••••••••</span>
            <button
              onClick={handleRevoke}
              className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} />
              Revoke
            </button>
          </div>
        )}
      </div>

      {/* What is MCP */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        The Model Context Protocol (MCP) lets AI coding tools like Claude Code and Cursor read and modify your story maps directly.
        The server runs on this app — just connect your tool using the instructions below.
      </p>

      {/* Available Tools (collapsible) */}
      <div className="mb-4">
        <button
          onClick={() => setToolsOpen(!toolsOpen)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          {toolsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Available Tools ({MCP_TOOLS.reduce((sum, g) => sum + g.tools.length, 0)})
        </button>
        {toolsOpen && (
          <div className="mt-2 space-y-3">
            {MCP_TOOLS.map((group) => (
              <div key={group.group}>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{group.group}</div>
                <div className="space-y-1">
                  {group.tools.map((tool) => (
                    <div key={tool.name} className="flex items-baseline gap-2 text-xs">
                      <code className="font-mono text-blue-600 dark:text-blue-400 shrink-0">{tool.name}</code>
                      <span className="text-gray-500 dark:text-gray-400">{tool.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Setup Guide - Tabs */}
      <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-3">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Setup Guide</div>
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setActiveTab('claude')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'claude'
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Claude Code
          </button>
          <button
            onClick={() => setActiveTab('cursor')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'cursor'
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Cursor
          </button>
        </div>

        {activeTab === 'claude' && (
          <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">1.</span> Generate an API token above (if you haven't already)
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">2.</span> Run in terminal:
              <div className="mt-1">
                <CodeBlock>{`claude mcp add --scope user user-story-mapper --transport http ${mcpUrl} -H "Authorization: Bearer <your-token>"`}</CodeBlock>
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">3.</span> Start a new Claude Code conversation
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">4.</span> Test: Ask "List my story map projects"
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">5.</span> To remove:{' '}
              <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">claude mcp remove --scope user user-story-mapper</code>
            </div>
            <div className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
              This adds the server globally. Use <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">--scope project</code> to limit to the current directory.
            </div>
          </div>
        )}

        {activeTab === 'cursor' && (
          <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">1.</span> Generate an API token above
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">2.</span> Create or edit <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">.cursor/mcp.json</code> in your project root:
              <div className="mt-1">
                <CodeBlock>{`{
  "mcpServers": {
    "user-story-mapper": {
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer <your-token>"
      }
    }
  }
}`}</CodeBlock>
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">3.</span> Restart Cursor (Cmd+Shift+P → "Reload Window")
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">4.</span> Verify: MCP tools should appear in the tools panel
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">5.</span> Test: Ask "List my story map projects"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
