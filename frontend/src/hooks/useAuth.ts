import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { initFirebase, getFirebaseAuth } from '../lib/firebase';
import { api } from '../api/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthConfig {
  authEnabled: boolean;
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
  };
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  authEnabled: boolean;
  hasApiKey: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshApiKeyStatus: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  authEnabled: false,
  hasApiKey: false,
  login: async () => {},
  logout: async () => {},
  getToken: async () => null,
  refreshApiKeyStatus: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const firebaseUserRef = useRef<User | null>(null);

  const refreshApiKeyStatus = useCallback(async () => {
    try {
      const { hasKey } = await api.getApiKeyStatus();
      setHasApiKey(hasKey);
    } catch {
      // ignore — will show as no key
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    fetch('/api/auth/config')
      .then(res => res.json())
      .then((config: AuthConfig) => {
        if (!config.authEnabled) {
          // No auth — set synthetic dev user
          setAuthEnabled(false);
          setUser({ id: 'local-dev', email: 'dev@local', name: 'Local Dev', picture: '' });
          refreshApiKeyStatus();
          setLoading(false);
          return;
        }

        setAuthEnabled(true);
        const { auth } = initFirebase(config.firebaseConfig!);

        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          firebaseUserRef.current = fbUser;
          if (fbUser) {
            const token = await fbUser.getIdToken();
            const meRes = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (meRes.ok) {
              const me = await meRes.json();
              setUser({ id: me.id, email: me.email, name: me.name, picture: me.picture || '' });
              refreshApiKeyStatus();
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        });
      })
      .catch(() => {
        // If config fetch fails, assume no auth
        setUser({ id: 'local-dev', email: 'dev@local', name: 'Local Dev', picture: '' });
        refreshApiKeyStatus();
        setLoading(false);
      });

    return () => unsubscribe?.();
  }, [refreshApiKeyStatus]);

  const login = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
    setUser(null);
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    const fbUser = firebaseUserRef.current;
    if (!fbUser) return null;
    return fbUser.getIdToken();
  }, []);

  return { user, loading, authEnabled, hasApiKey, login, logout, getToken, refreshApiKeyStatus };
}
