import { keyFeatures, sampleMatches } from '@/data/features';
import {
  Moon,
  DollarSign,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';

const featureIcons = [Moon, DollarSign, Sparkles, ShieldCheck];

export default function Features() {
  return (
    <section id="features" className="relative py-24 bg-navy-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/60 px-4 py-1 text-xs font-semibold text-purple-300 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Built For Student Life</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Why Students Love FlatMate AI
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Traditional rental boards match you with an apartment, but not the human living in it. We solve the roommate problem first.
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {keyFeatures.map((feat, idx) => {
            const Icon = featureIcons[idx] || Sparkles;

            return (
              <div
                key={feat.title}
                className="rounded-2xl border border-purple-900/40 bg-navy-900/60 p-6 backdrop-blur-md hover:border-purple-500/50 hover:bg-navy-900/80 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-950 border border-purple-700/40 text-purple-400 mb-5">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">
                    {feat.tag}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-white">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Matching Community Showcase */}
        <div id="community" className="mt-20 rounded-3xl border border-purple-800/40 bg-gradient-to-b from-navy-900/90 to-navy-950 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl">
            <span className="text-xs uppercase font-semibold text-purple-400 tracking-wider">Campus Network</span>
            <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
              Meet Compatible Students Near Your University
            </h3>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              Every profile is backed by campus verification. See lifestyle habits, verified college majors, and real compatibility scores before reaching out.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {sampleMatches.map((match) => (
              <div
                key={match.name}
                className="flex items-center justify-between rounded-xl border border-purple-900/50 bg-navy-950/80 p-4 transition-all hover:border-purple-600/40"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                    {match.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {match.name}
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded-full">
                        {match.matchScore}% Match
                      </span>
                    </h4>
                    <p className="text-xs text-purple-300/80">{match.major}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {match.tags.map((t) => (
                        <span key={t} className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-900/50">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right pl-2">
                  <span className="text-xs font-semibold text-white block">{match.budget}</span>
                  <span className="text-[10px] text-slate-400">Target Rent</span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
