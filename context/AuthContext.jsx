'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isConfigured: false,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  // Fetch the user's profile from the public.profiles table
  const fetchProfile = useCallback(async (userId) => {
    if (!configured || !supabase || !userId) {
      setProfile(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[FlatMate AI] Error fetching profile:', error.message);
        return null;
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error('[FlatMate AI] Unexpected error fetching profile:', err);
      return null;
    }
  }, [configured]);

  // Initial session check and reactive auth listener
  useEffect(() => {
    if (!configured || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[FlatMate AI] Session fetch warning:', error.message);
        }

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await fetchProfile(initialSession.user.id);
          }
        }
      } catch (err) {
        console.error('[FlatMate AI] Failed getting initial session:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen to changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [configured, fetchProfile]);

  // Email / Password Sign Up
  const signUp = async ({ email, password, name }) => {
    if (!configured || !supabase) {
      return {
        error: { message: 'Supabase credentials are not configured in your .env.local file yet.' },
      };
    }

    try {
      const emailRedirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            name: name?.trim() || '',
          },
        },
      });

      if (error) return { error };

      // In Supabase Auth, session is null whenever email confirmation is required before login
      const requiresConfirmation = Boolean(data?.user && !data?.session);

      // If user is immediately logged in (email confirmation disabled), hydrate state
      if (data?.user && data?.session) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id);
      }

      return { data, requiresConfirmation };
    } catch (err) {
      return { error: { message: err.message || 'An unexpected error occurred during signup.' } };
    }
  };

  // Email / Password Sign In
  const signIn = async ({ email, password }) => {
    if (!configured || !supabase) {
      return {
        error: { message: 'Supabase credentials are not configured in your .env.local file yet.' },
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id);
      }

      return { data };
    } catch (err) {
      return { error: { message: err.message || 'An unexpected error occurred during login.' } };
    }
  };

  // Sign Out
  const signOut = async () => {
    if (!configured || !supabase) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[FlatMate AI] Logout error:', error.message);
      }
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  // Update Profile
  const updateProfile = async (profileData) => {
    if (!configured || !supabase || !user) {
      return { error: { message: 'You must be signed in to update your profile.' } };
    }

    // Client-side validation: Nonnegative budgets and min <= max
    const minB = profileData.min_budget !== '' && profileData.min_budget !== null && profileData.min_budget !== undefined
      ? Number(profileData.min_budget)
      : null;
    const maxB = profileData.max_budget !== '' && profileData.max_budget !== null && profileData.max_budget !== undefined
      ? Number(profileData.max_budget)
      : null;

    if (minB !== null && (isNaN(minB) || minB < 0)) {
      return { error: { message: 'Minimum budget must be a non-negative number.' } };
    }
    if (maxB !== null && (isNaN(maxB) || maxB < 0)) {
      return { error: { message: 'Maximum budget must be a non-negative number.' } };
    }
    if (minB !== null && maxB !== null && minB > maxB) {
      return { error: { message: 'Minimum budget cannot exceed maximum budget.' } };
    }

    const payload = {
      id: user.id,
      name: profileData.name?.trim() ?? '',
      city: profileData.city?.trim() ?? null,
      locality: profileData.locality?.trim() ?? null,
      min_budget: minB,
      max_budget: maxB,
      food_preference: profileData.food_preference ?? null,
      cleanliness_level: profileData.cleanliness_level ?? null,
      sleep_schedule: profileData.sleep_schedule ?? null,
      lifestyle: profileData.lifestyle ?? null,
      bio: profileData.bio?.trim() ?? null,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload)
        .select()
        .single();

      if (error) return { error };

      setProfile(data);
      return { data };
    } catch (err) {
      return { error: { message: err.message || 'Failed to save profile changes.' } };
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured: configured,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

