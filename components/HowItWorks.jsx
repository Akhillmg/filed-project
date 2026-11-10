import { howItWorksSteps } from '@/data/howItWorks';
import { Sparkles, Cpu, ShieldCheck, ArrowRight } from 'lucide-react';

const iconMap = {
  Sparkles: Sparkles,
  Cpu: Cpu,
  ShieldCheck: ShieldCheck,
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 bg-navy-900 border-t border-purple-900/30">
      {/* Background accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-purple-600/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/60 px-4 py-1 text-xs font-semibold text-purple-300 backdrop-blur-md mb-4">
            <Cpu className="h-3.5 w-3.5 text-purple-400" />
            <span>Smart 3-Step Process</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            How FlatMate AI Works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Finding compatible roommates shouldn't be a gamble. Here is how our AI takes the guesswork out of college co-living.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {howItWorksSteps.map((item, index) => {
            const Icon = iconMap[item.icon] || Sparkles;

            return (
              <div
                key={item.step}
                className="group relative rounded-2xl border border-purple-800/30 bg-navy-950/70 p-8 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/60 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-purple-900/20 flex flex-col justify-between"
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div>
                  {/* Step badge & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-4xl font-black text-purple-500/30 group-hover:text-purple-400/60 transition-colors">
                      {item.step}
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-950/80 border border-purple-600/40 text-purple-300 shadow-inner shadow-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Title & Tag */}
                  <div className="mb-2">
                    <span className="inline-block text-[11px] font-semibold tracking-wider text-purple-400 uppercase mb-2">
                      {item.badge}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-purple-900/30 flex items-center text-xs font-semibold text-purple-300 group-hover:text-purple-200 gap-1.5">
                  <span>Step {item.step} Complete</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA banner below steps */}
        <div className="mt-16 text-center">
          <a
            href="#hero-cta"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.02]"
          >
            <span>Start Your Roommate Search Now</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

      </div>
    </section>
  );
}
