import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Users,
  Compass,
  Heart,
  Star,
} from 'lucide-react';
import { sampleMatches } from '@/data/features';

export default function Hero() {
  const featuredMatch = sampleMatches[0];

  return (
    <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 bg-navy-950">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column: Headline and Call-to-actions */}
          <div className="text-center lg:text-left lg:col-span-7">
            {/* Top Pill / Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/60 px-4 py-1.5 text-xs font-semibold text-purple-300 backdrop-blur-md shadow-inner shadow-purple-500/20 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
              <span>Next-Gen College Roommate Matching</span>
            </div>

            {/* Main Hero Heading */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl leading-[1.15]">
              Find Your <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
                Perfect Flatmate
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Skip awkward roommate surprises. FlatMate AI connects college students and young professionals based on real lifestyle compatibility—from sleep hours and study habits to budget and cleanliness.
            </p>

            {/* CTAs */}
            <div id="hero-cta" className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/discover"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-purple-600/30 transition-all duration-300 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/50 hover:scale-[1.02]"
              >
                <span>Find Flatmates</span>
                <ArrowRight className="h-5 w-5" />
              </Link>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-purple-700/40 bg-navy-900/60 px-6 py-4 text-base font-medium text-slate-200 backdrop-blur-sm transition-all hover:bg-navy-800/80 hover:border-purple-500/60 hover:text-white"
              >
                <span>How It Works</span>
              </a>
            </div>

            {/* Trust Points */}
            <div className="mt-10 pt-8 border-t border-purple-900/40 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">98%</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Match Harmony</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">5,000+</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">College Students</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">100%</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Verified Profiles</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive AI Match Preview Card */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Glow backdrop behind card */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 to-indigo-600/20 rounded-3xl blur-2xl -z-10" />

            <div className="w-full max-w-md rounded-2xl border border-purple-500/30 bg-navy-900/85 p-6 shadow-2xl backdrop-blur-xl relative">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-purple-900/50">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Active Match</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 px-3 py-1 text-xs font-bold text-purple-300">
                  <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                  <span>{featuredMatch.matchScore}% Match</span>
                </div>
              </div>

              {/* Profile Details */}
              <div className="mt-5 flex items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-0.5 shadow-md">
                    <div className="h-full w-full rounded-[14px] bg-navy-950 flex items-center justify-center text-xl font-bold text-white">
                      AS
                    </div>
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] text-white">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{featuredMatch.name}</h3>
                  <p className="text-xs text-purple-300">{featuredMatch.major}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Budget: <span className="text-slate-200">{featuredMatch.budget}</span></p>
                </div>
              </div>

              {/* Compatibility Dimensions */}
              <div className="mt-5 space-y-3 rounded-xl bg-navy-950/60 p-4 border border-purple-900/40">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex justify-between">
                  <span>AI Lifestyle Compatibility</span>
                  <span className="text-purple-400">High Sync</span>
                </div>

                {/* Progress bar 1 */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Sleep & Study Habits</span>
                    <span className="font-semibold text-purple-300">98%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 w-[98%]" />
                  </div>
                </div>

                {/* Progress bar 2 */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Cleanliness & Chores</span>
                    <span className="font-semibold text-purple-300">94%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 w-[94%]" />
                  </div>
                </div>

                {/* Progress bar 3 */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Social & Noise Preference</span>
                    <span className="font-semibold text-purple-300">92%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 w-[92%]" />
                  </div>
                </div>
              </div>

              {/* Lifestyle Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {featuredMatch.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-lg border border-purple-700/30 bg-purple-950/40 px-2.5 py-1 text-xs font-medium text-purple-200"
                  >
                    <CheckCircle2 className="h-3 w-3 text-purple-400" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Preview Button */}
              <div className="mt-5 pt-4 border-t border-purple-900/40 flex items-center gap-3">
                <Link
                  href="/discover"
                  className="w-full rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 py-2.5 text-xs font-semibold text-purple-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Heart className="h-3.5 w-3.5 text-pink-400" />
                  Connect With Aarav
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
