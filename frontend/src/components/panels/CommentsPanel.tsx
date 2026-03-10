import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Loader2, Bot, MessageCircle } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';
import { useAI } from '../../hooks/useAI';
import { api } from '../../api/client';
import { AutoExpandTextarea } from '../ui/AutoExpandTextarea';
import { SIDEBAR_PANEL, INPUT_BASE, GLASS_BORDER } from '../../styles/shared';
import type { Comment, EditOperation } from '../../types';

export function CommentsPanel() {
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const projectId = useMapStore((s) => s.projectId);
  const projectRole = useMapStore((s) => s.projectRole);
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const nodes = useMapStore((s) => s.nodes);
  const incrementCommentCount = useMapStore((s) => s.incrementCommentCount);
  const decrementCommentCount = useMapStore((s) => s.decrementCommentCount);
  const applyOperations = useMapStore((s) => s.applyOperations);
  const setPendingSaveLabel = useMapStore((s) => s.setPendingSaveLabel);
  const { selectedModel } = useAI();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const canEdit = projectRole === 'owner' || projectRole === 'editor';

  // Load comments on mount
  useEffect(() => {
    if (!projectId || !selectedNodeId) return;
    setLoading(true);
    api.listComments(projectId, selectedNodeId)
      .then(setComments)
      .catch(() => setError('Failed to load comments'))
      .finally(() => setLoading(false));
  }, [projectId, selectedNodeId]);

  // Auto-scroll to bottom when comments change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = useCallback(async () => {
    if (!newComment.trim() || !projectId || !selectedNodeId) return;
    setSending(true);
    setError(null);
    const optimisticContent = newComment.trim();
    setNewComment('');

    try {
      const comment = await api.addComment(projectId, selectedNodeId, optimisticContent);
      setComments((prev) => [...prev, comment]);
      incrementCommentCount(selectedNodeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send comment');
      setNewComment(optimisticContent); // restore on error
    } finally {
      setSending(false);
    }
  }, [newComment, projectId, selectedNodeId, incrementCommentCount]);

  const handleDelete = useCallback(async (commentId: string) => {
    if (!projectId || !selectedNodeId) return;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      await api.deleteComment(projectId, commentId);
      decrementCommentCount(selectedNodeId);
    } catch {
      // Reload comments on error
      if (projectId && selectedNodeId) {
        api.listComments(projectId, selectedNodeId).then(setComments);
      }
    }
  }, [projectId, selectedNodeId, decrementCommentCount]);

  const handleApply = useCallback(async () => {
    if (!projectId || !selectedNodeId || !selectedModel) return;
    setApplying(true);
    setError(null);
    try {
      const result = await api.applyComments(projectId, selectedNodeId, selectedModel);
      if (result.operations && Array.isArray(result.operations)) {
        applyOperations(result.operations as EditOperation[]);
        setPendingSaveLabel('AI Edit (from discussion)');
      }
      // Reload comments to get system message
      const updatedComments = await api.listComments(projectId, selectedNodeId);
      setComments(updatedComments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply changes');
    } finally {
      setApplying(false);
    }
  }, [projectId, selectedNodeId, selectedModel, applyOperations, setPendingSaveLabel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const close = () => {
    setActivePanel('none');
  };

  if (!selectedNodeId || !node) return null;

  return (
    <div className={`${SIDEBAR_PANEL} flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle size={16} className="text-[#7B2FFF] dark:text-[#C6FF4D] shrink-0" />
            <h3 className="font-semibold text-[#080810] dark:text-[#F0EEFF] truncate text-sm">
              {node.data.title}
            </h3>
          </div>
          <button
            onClick={close}
            className="p-1 hover:bg-[#7B2FFF]/10 dark:hover:bg-[#7B2FFF]/20 rounded-md text-[#7A7A9A] hover:text-[#7B2FFF] transition-colors duration-150 shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Comments thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-[#7A7A9A]" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#7A7A9A]">
            No comments yet. Start a discussion!
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className={c.is_system_message ? 'flex justify-center' : ''}>
              {c.is_system_message ? (
                <div className="text-xs text-[#7A7A9A] italic bg-[#7A7A9A]/10 rounded-lg px-3 py-1.5 max-w-[90%] text-center">
                  <Bot size={12} className="inline mr-1" />
                  {c.content}
                </div>
              ) : (
                <div className="group">
                  <div className="flex items-center gap-2 mb-0.5">
                    {c.user_picture ? (
                      <img src={c.user_picture} alt="" className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#7B2FFF]/20 flex items-center justify-center text-[8px] font-bold text-[#7B2FFF]">
                        {c.user_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <span className="text-xs font-medium text-[#080810] dark:text-[#F0EEFF]">{c.user_name}</span>
                    <span className="text-[10px] text-[#7A7A9A]">
                      {new Date(c.created_at + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-600 transition-opacity"
                    >
                      delete
                    </button>
                  </div>
                  <div className="text-sm text-[#080810]/80 dark:text-[#F0EEFF]/80 pl-7 whitespace-pre-wrap break-words">
                    {c.content}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 pb-2">
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/40 px-2 py-1 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Apply button (editors/owners only, when there are comments) */}
      {canEdit && comments.length > 0 && (
        <div className="px-4 pb-2">
          <button
            onClick={handleApply}
            disabled={applying}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7B2FFF] dark:text-[#C6FF4D] bg-[#7B2FFF]/10 dark:bg-[#C6FF4D]/10 hover:bg-[#7B2FFF]/20 dark:hover:bg-[#C6FF4D]/20 rounded-lg border border-[#7B2FFF]/20 dark:border-[#C6FF4D]/20 transition-colors duration-150 disabled:opacity-50"
          >
            {applying ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Bot size={12} />
                Apply Changes via AI
              </>
            )}
          </button>
        </div>
      )}

      {/* Input area */}
      <div className={`p-4 border-t ${GLASS_BORDER}`}>
        <div className="flex items-end gap-2">
          <AutoExpandTextarea
            minRows={1}
            maxRows={4}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            className={`flex-1 ${INPUT_BASE} px-3 py-2 focus:outline-none placeholder:text-[#7A7A9A]`}
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={sending || !newComment.trim()}
            className="btn-primary p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 self-end"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
