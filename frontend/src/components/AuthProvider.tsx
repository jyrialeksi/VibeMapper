import { type ReactNode, useEffect } from 'react';
import { AuthContext, useAuthProvider } from '../hooks/useAuth';
import { setTokenProvider, setOnUnauthorized } from '../api/client';

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthProvider();

  useEffect(() => {
    setTokenProvider(auth.getToken);
    setOnUnauthorized(() => {
      if (auth.authEnabled) {
        auth.logout();
      }
    });
  }, [auth.getToken, auth.authEnabled, auth.logout]);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
