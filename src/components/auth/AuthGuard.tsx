import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Client-side auth guard that protects dashboard routes.
 * Shows a loading spinner while checking auth, redirects to /login if not authenticated.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        window.location.href = '/login';
      } else {
        setReady(true);
      }
    }
  }, [loading, isAuthenticated]);

  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <svg className="w-6 h-6 text-white animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
