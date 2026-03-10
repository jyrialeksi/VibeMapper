import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Moon, Sun, LogIn, Loader2 } from 'lucide-react';

export function LoginPage() {
  const { login, error } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [signingIn, setSigningIn] = useState(false);

  const handleLogin = async () => {
    setSigningIn(true);
    try {
      await login();
      // Browser navigates away for redirect — signingIn stays true
    } catch {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0EEFF] dark:bg-[#080810] flex items-center justify-center">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-white/85 dark:bg-[#0F0F1E]/85 backdrop-blur-xl border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] shadow-sm text-[#080810]/70 dark:text-[#F0EEFF]/70 hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10 transition-colors duration-150"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="bg-white/85 dark:bg-[#0F0F1E]/85 backdrop-blur-xl border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] rounded-2xl shadow-lg p-8 max-w-sm w-full mx-4 text-center">
        <h1 className="font-display text-4xl text-[#080810] dark:text-[#F0EEFF] mb-2 tracking-wide">
          VIBEMAPPER
        </h1>
        <p className="text-[#7A7A9A] mb-8 text-sm">
          Create and manage user story maps with AI assistance
        </p>

        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-2 btn-primary px-5 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          {signingIn ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Redirecting to Google…
            </>
          ) : (
            <>
              <LogIn size={18} />
              Sign in with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}
