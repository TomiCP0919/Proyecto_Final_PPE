import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../lib/auth';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Client-side auth guard that protects dashboard routes.
 * Shows a loading spinner while checking auth, redirects to /login if not authenticated,
 * and intercepts users whose accounts are pending approval or rejected.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading, profile } = useAuth();
  const [ready, setReady] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        setReady(false);
        window.location.href = '/login';
      } else {
        setReady(true);
      }
    }
  }, [loading, isAuthenticated]);

  const handleLogout = async () => {
    setReady(false);
    setSigningOut(true);
    try {
      await signOut();
      window.location.href = '/login';
    } catch {
      setReady(true);
      setSigningOut(false);
    }
  };

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

  // Interceptar usuarios que no están aprobados
  if (profile && profile.approval_status !== 'approved') {
    const isRejected = profile.approval_status === 'rejected';

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)' }}>
        {/* Decoración de fondo */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }}
          />
          <div
            className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-8 blur-3xl"
            style={{ background: 'radial-gradient(circle, #ef4444, transparent)' }}
          />
        </div>

        <div className="relative w-full max-w-md animate-fade-in text-center">
          <div className="glass-card p-8 flex flex-col items-center">
            {isRejected ? (
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-red-500/10 border border-red-500/30 text-red-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-blue-500/10 border border-blue-500/30 text-blue-400 animate-pulse">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}

            <h2 className="text-xl font-bold text-white mb-3">
              {isRejected ? 'Acceso Rechazado' : 'Acceso Pendiente'}
            </h2>

            <p className="text-sm leading-relaxed mb-2" style={{ color: '#94a3b8' }}>
              {isRejected
                ? 'Tu solicitud de acceso al panel de administración de TechHub ha sido rechazada por un administrador.'
                : 'Tu cuenta ha sido registrada en el sistema y se encuentra en espera de la aprobación de un administrador.'}
            </p>
            <p className="text-xs font-semibold mb-6 truncate max-w-full" style={{ color: '#64748b' }}>
              Usuario: {profile.email || 'Sin correo electrónico'}
            </p>

            <button
              onClick={handleLogout}
              disabled={signingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
              style={{
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(239, 68, 68, 0.16)';
                el.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                el.style.color = '#f87171';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(239, 68, 68, 0.08)';
                el.style.borderColor = 'rgba(239, 68, 68, 0.15)';
                el.style.color = '#ef4444';
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {signingOut ? 'Cerrando...' : 'Cerrar Sesión'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
