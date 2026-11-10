import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-purple-900/30 bg-navy-950 py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              FlatMate <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">AI</span>
            </span>
            <span className="text-xs text-slate-500 ml-2">College Field Project</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/discover" className="hover:text-purple-400 transition-colors">
              Discover
            </Link>
            <Link href="/expenses" className="hover:text-purple-400 transition-colors">
              Split Expenses
            </Link>
            <Link href="/profile" className="hover:text-purple-400 transition-colors">
              My Profile
            </Link>
            <Link href="/#how-it-works" className="hover:text-purple-400 transition-colors">
              How It Works
            </Link>
            <Link href="/#features" className="hover:text-purple-400 transition-colors">
              Features
            </Link>
          </div>

          {/* Copyright & Credit */}
          <div className="text-xs text-slate-500 text-center md:text-right">
            <p>&copy; {new Date().getFullYear()} FlatMate AI. Built for student community living.</p>
            <p className="mt-1 flex items-center justify-center md:justify-end gap-1 text-[11px] text-slate-600">
              Engineered with Next.js, Tailwind CSS & Supabase
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
