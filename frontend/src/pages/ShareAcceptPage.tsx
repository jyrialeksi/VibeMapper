import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export function ShareAcceptPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!shareToken || !user) return;

    api.acceptShareLink(shareToken)
      .then(({ projectId }) => {
        navigate(`/project/${projectId}`, { replace: true });
      })
      .catch((err) => {
        console.error('Failed to accept share link:', err);
        navigate('/', { replace: true });
      });
  }, [shareToken, user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500 dark:text-gray-400">Processing share link...</div>
    </div>
  );
}
