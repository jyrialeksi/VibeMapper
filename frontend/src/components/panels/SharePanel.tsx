import { useState, useEffect, useCallback } from 'react';
import { X, Check, UserPlus, Link, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import type { Share } from '../../types';

interface SharePanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SharePanel({ projectId, isOpen, onClose }: SharePanelProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const loadShares = useCallback(async () => {
    try {
      const data = await api.listShares(projectId);
      setShares(data);
    } catch {
      // Ignore — user might not be owner
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) loadShares();
  }, [isOpen, loadShares]);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    try {
      const share = await api.addShare(projectId, email.trim(), role);
      setShares((prev) => [share, ...prev]);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (shareId: string, newRole: 'viewer' | 'editor') => {
    try {
      const updated = await api.updateShare(projectId, shareId, newRole);
      setShares((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleRemove = async (shareId: string) => {
    try {
      await api.removeShare(projectId, shareId);
      setShares((prev) => prev.filter((s) => s.id !== shareId));
    } catch (err) {
      console.error('Failed to remove share:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      const { url } = await api.createShareLink(projectId, 'viewer');
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to create share link:', err);
    }
  };

  if (!isOpen) return null;

  const emailShares = shares.filter((s) => s.invited_email !== 'link-share');
  const linkShares = shares.filter((s) => s.invited_email === 'link-share');

  return (
    <div className="fixed inset-y-0 right-0 w-80 z-50 bg-white/95 dark:bg-[#0F0F1E]/95 backdrop-blur-xl border-l border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)]">
        <h3 className="text-sm font-semibold text-[#080810] dark:text-[#F0EEFF]">Share Project</h3>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#7A7A9A] hover:text-[#7B2FFF] dark:hover:text-[#C6FF4D]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Invite by email */}
        <div>
          <label className="text-xs font-medium text-[#7A7A9A] mb-1.5 block">
            Invite by email
          </label>
          <div className="flex gap-1.5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              placeholder="colleague@example.com"
              className="flex-1 text-xs border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#16162A] dark:text-[#F0EEFF] focus:outline-none focus:ring-1 focus:ring-[#7B2FFF]/30"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
              className="text-xs border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] rounded-lg px-1.5 py-1.5 bg-white dark:bg-[#16162A] dark:text-[#F0EEFF]"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          <button
            onClick={handleInvite}
            disabled={loading || !email.trim()}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-medium btn-primary px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            <UserPlus size={12} />
            Invite
          </button>
          {error && (
            <p className="mt-1 text-xs text-red-500">{error}</p>
          )}
        </div>

        {/* Copy link */}
        <div>
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] text-[#080810]/70 dark:text-[#F0EEFF]/70 px-3 py-1.5 rounded-lg hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10 transition-colors"
          >
            {copiedLink ? <Check size={12} className="text-green-500" /> : <Link size={12} />}
            {copiedLink ? 'Link copied!' : 'Copy shareable link'}
          </button>
        </div>

        {/* Current shares */}
        {emailShares.length > 0 && (
          <div>
            <label className="text-xs font-medium text-[#7A7A9A] mb-1.5 block">
              People with access
            </label>
            <div className="space-y-1.5">
              {emailShares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#7B2FFF]/5 dark:bg-[#16162A]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[#080810] dark:text-[#F0EEFF] truncate">
                      {share.user_name || share.invited_email}
                    </div>
                    {share.user_name && (
                      <div className="text-[10px] text-[#7A7A9A] truncate">{share.invited_email}</div>
                    )}
                    {!share.user_id && (
                      <span className="text-[10px] text-[#C6FF4D]">Pending</span>
                    )}
                  </div>
                  <select
                    value={share.role}
                    onChange={(e) => handleUpdateRole(share.id, e.target.value as 'viewer' | 'editor')}
                    className="text-[10px] border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] rounded px-1 py-0.5 bg-white dark:bg-[#16162A] dark:text-[#F0EEFF]/70"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={() => handleRemove(share.id)}
                    className="p-1 text-[#7A7A9A] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link shares */}
        {linkShares.length > 0 && (
          <div>
            <label className="text-xs font-medium text-[#7A7A9A] mb-1.5 block">
              Shareable links ({linkShares.length})
            </label>
            <div className="space-y-1">
              {linkShares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#7B2FFF]/5 dark:bg-[#16162A]"
                >
                  <div className="flex items-center gap-1.5">
                    <Link size={10} className="text-[#7A7A9A]" />
                    <span className="text-[10px] text-[#7A7A9A]">
                      {share.role} &middot; {new Date(share.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemove(share.id)}
                    className="p-1 text-[#7A7A9A] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
