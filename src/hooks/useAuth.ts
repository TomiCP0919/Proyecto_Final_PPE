import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile, onAuthStateChange } from '../lib/auth';
import type { Profile } from '../lib/types';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    profile: null,
    loading: true,
  });

  const refreshProfile = useCallback(async (session: Session | null) => {
    if (!session) {
      setState({ session: null, profile: null, loading: false });
      return;
    }

    try {
      const profile = await getProfile();
      if (!profile) {
        // Si no se puede obtener el perfil (token inválido/expirado), forzamos limpieza
        setState({ session: null, profile: null, loading: false });
      } else {
        setState({ session, profile, loading: false });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      setState({ session: null, profile: null, loading: false });
    }
  }, []);

  useEffect(() => {
    /* Initial session check */
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        refreshProfile(session);
      })
      .catch((error) => {
        console.error('Error checking session:', error);
        setState(s => ({ ...s, loading: false }));
      });

    /* Listen for auth changes */
    const unsubscribe = onAuthStateChange((_event, session) => {
      refreshProfile(session);
    });

    return unsubscribe;
  }, [refreshProfile]);

  return {
    session: state.session,
    profile: state.profile,
    user: state.session?.user ?? null,
    loading: state.loading,
    isAuthenticated: !!state.session,
  };
}
