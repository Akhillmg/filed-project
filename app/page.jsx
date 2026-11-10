import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      <Hero />
      <HowItWorks />
      <Features />
    </div>
  );
}
