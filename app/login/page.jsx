'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-purple-800/40 bg-navy-900/90 p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 mb-4">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Already Signed In</h2>
          <p className="text-slate-300 text-sm mb-6">
            You are logged in as <span className="text-purple-300 font-semibold">{user.email}</span>.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 hover:opacity-95"
            >
              Go to My Profile
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-700/60 bg-navy-850 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured yet. Please supply valid credentials in .env.local.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signIn({
        email,
        password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          setErrorMessage(
            'Your email has not been confirmed yet. Please check your inbox for the Supabase confirmation link.'
          );
        } else {
          setErrorMessage(error.message || 'Invalid email or password.');
        }
        return;
      }

      if (data?.session) {
        router.push('/profile');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-16 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative w-full max-w-md">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/60 px-4 py-1 text-xs font-semibold text-purple-300 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Welcome Back</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Sign in to FlatMate AI</h1>
          <p className="mt-2 text-sm text-slate-300">
            Access your roommate matches, saved preferences, and listings.
          </p>
        </div>

        {/* Card Content */}
        <div className="rounded-2xl border border-purple-900/40 bg-navy-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-200">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@college.edu"
                  className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition-all duration-200 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-4 text-center text-xs text-slate-400">
              Don't have an account?{' '}
              <Link href="/signup" className="font-semibold text-purple-400 hover:text-purple-300 underline">
                Create one now
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

