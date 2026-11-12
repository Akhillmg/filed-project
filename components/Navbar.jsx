'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Menu, X, Users, User, LogOut, LogIn, AlertCircle, Compass, Calculator } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, isConfigured } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-900/30 bg-navy-950/80 backdrop-blur-xl">
      {!isConfigured && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-center text-xs text-amber-300 flex items-center justify-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Supabase is not yet configured. Please add your real Project URL and anon key to{' '}
            <code className="bg-black/30 px-1 py-0.5 rounded font-mono">.env.local</code> or your deployment Environment Variables and redeploy.
          </span>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-violet-500 to-indigo-500 shadow-md shadow-purple-500/30 transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              FlatMate <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">AI</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-purple-300/70 font-medium">College Match</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-300 transition-colors hover:text-white"
          >
            <Compass className="h-4 w-4 text-purple-400" />
            <span>Discover</span>
          </Link>
          <Link
            href="/expenses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 transition-colors hover:text-purple-400"
          >
            <Calculator className="h-4 w-4" />
            <span>Split Expenses</span>
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-purple-400"
          >
            How It Works
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-purple-400"
          >
            Features
          </Link>
          <Link
            href="/#community"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-purple-400"
          >
            Community
          </Link>
          {user && (
            <Link
              href="/profile"
              className="text-sm font-medium text-slate-300 hover:text-purple-300 transition-colors"
            >
              My Profile
            </Link>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl border border-purple-800/40 bg-navy-900/70 px-3.5 py-2 text-sm text-slate-200 hover:border-purple-600/60 hover:text-white transition-all"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-semibold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate font-medium">{displayName}</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/50 bg-navy-900/40 px-3.5 py-2 text-sm font-medium text-slate-300 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition-all duration-200 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/40 hover:-translate-y-0.5"
              >
                <Users className="h-4 w-4" />
                <span>Find Flatmates</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex md:hidden items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-navy-900 hover:text-white focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-purple-900/40 bg-navy-900/95 px-6 py-6 backdrop-blur-2xl">
          <div className="flex flex-col gap-4">
            <Link
              href="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-purple-300 flex items-center gap-2"
            >
              <Compass className="h-4 w-4" />
              <span>Discover Roommates & Flats</span>
            </Link>
            <Link
              href="/expenses"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-300 hover:text-purple-400 flex items-center gap-2"
            >
              <Calculator className="h-4 w-4 text-purple-400" />
              <span>Split Expenses (₹)</span>
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-300 hover:text-purple-400"
            >
              How It Works
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-300 hover:text-purple-400"
            >
              Features
            </Link>
            <Link
              href="/#community"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-300 hover:text-purple-400"
            >
              Community
            </Link>

            {user ? (
              <div className="pt-4 border-t border-purple-900/30 flex flex-col gap-3">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 py-2 text-purple-300 font-medium"
                >
                  <User className="h-4 w-4" />
                  <span>My Profile ({displayName})</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-left flex items-center gap-2 py-2 text-red-400 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-purple-900/30 flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl border border-purple-700/40 bg-navy-900/80 px-4 py-2.5 text-sm font-medium text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/discover"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-purple-600/30"
                >
                  Find Flatmates
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
