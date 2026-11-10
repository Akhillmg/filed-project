'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Compass,
  Search,
  Filter,
  MapPin,
  DollarSign,
  User,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Building,
  PlusCircle,
  Shield,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Database,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { calculateCompatibility, COMPATIBILITY_WEIGHTS } from '@/lib/matching';

// Curated realistic demo profiles used as fallback when Supabase table isn't migrated yet
const FALLBACK_DEMO_PROFILES = [
  {
    id: 'demo-1',
    name: 'Sarah Chen',
    city: 'Austin',
    locality: 'West Campus',
    min_budget: 800,
    max_budget: 1200,
    food_preference: 'Vegetarian',
    cleanliness_level: 'Highly Organized & Clean',
    sleep_schedule: 'Early Bird (before 11 PM)',
    lifestyle: 'College Student',
    bio: 'CS junior at UT Austin. Looking for a quiet, clean apartment near campus. Love cooking together and focused study sessions.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'demo-2',
    name: 'Marcus Brody',
    city: 'Austin',
    locality: 'Riverside / Downtown',
    min_budget: 950,
    max_budget: 1400,
    food_preference: 'Non-Vegetarian',
    cleanliness_level: 'Balanced / Normal',
    sleep_schedule: 'Night Owl (after 1 AM)',
    lifestyle: 'Working Professional',
    bio: 'Junior software developer working hybrid. Weekend cyclist, respectful of common areas, looking for easygoing roommate.',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'demo-3',
    name: 'Priya Sharma',
    city: 'Austin',
    locality: 'North Campus',
    min_budget: 750,
    max_budget: 1100,
    food_preference: 'Vegan',
    cleanliness_level: 'Highly Organized & Clean',
    sleep_schedule: 'Early Bird (before 11 PM)',
    lifestyle: 'College Student',
    bio: 'Biology major and pre-health peer tutor. Early riser, neat freak with kitchen spaces, plant enthusiast.',
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'demo-4',
    name: 'Liam Vance',
    city: 'Austin',
    locality: 'West Campus',
    min_budget: 600,
    max_budget: 900,
    food_preference: 'No Preference',
    cleanliness_level: 'Relaxed / Laid-back',
    sleep_schedule: 'Night Owl (after 1 AM)',
    lifestyle: 'College Student',
    bio: 'Economics major. Passionate about indie music and gaming. Chill vibe, flexible budget and adaptable roommate.',
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'demo-5',
    name: 'Elena Rostova',
    city: 'New York',
    locality: 'Greenwich Village',
    min_budget: 1400,
    max_budget: 2000,
    food_preference: 'Vegetarian',
    cleanliness_level: 'Balanced / Normal',
    sleep_schedule: 'Flexible',
    lifestyle: 'Working Professional',
    bio: 'Digital marketing specialist. Clean, quiet on weekdays, enjoy trying new cafes on weekends.',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'demo-6',
    name: 'David Kim',
    city: 'San Francisco',
    locality: 'Mission District',
    min_budget: 1600,
    max_budget: 2300,
    food_preference: 'Eggetarian',
    cleanliness_level: 'Highly Organized & Clean',
    sleep_schedule: 'Flexible',
    lifestyle: 'Remote / Freelancer',
    bio: 'Full-stack freelancer. Work from home in the living room or home office. Respect personal boundaries and cleanliness.',
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
];

export default function DiscoverPage() {
  const { user, profile: currentUserProfile, loading: authLoading } = useAuth();
  const configured = isSupabaseConfigured();

  // Mode: 'profiles' (Roommates) or 'listings' (Vacant Rooms/Flats)
  const [activeMode, setActiveMode] = useState('profiles');

  // Profiles State
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profilesError, setProfilesError] = useState('');
  const [usingDemoProfiles, setUsingDemoProfiles] = useState(false);
  const [schemaCacheError, setSchemaCacheError] = useState(false);

  // Listings State
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [listingsError, setListingsError] = useState('');
  const [isPostingListing, setIsPostingListing] = useState(false);
  const [newListing, setNewListing] = useState({
    title: '',
    city: '',
    locality: '',
    monthly_rent: '',
    description: '',
  });
  const [postingError, setPostingError] = useState('');
  const [postingSuccess, setPostingSuccess] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterLocality, setFilterLocality] = useState('');
  const [filterMinBudget, setFilterMinBudget] = useState('');
  const [filterMaxBudget, setFilterMaxBudget] = useState('');
  const [filterFood, setFilterFood] = useState('All');
  const [filterSleep, setFilterSleep] = useState('All');
  const [filterCleanliness, setFilterCleanliness] = useState('All');
  const [filterLifestyle, setFilterLifestyle] = useState('All');
  const [sortBy, setSortBy] = useState('compatibility_desc'); // 'compatibility_desc' | 'budget_asc' | 'budget_desc' | 'newest'

  // Selected Profile for detail view / connect modal
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [connectMessageSent, setConnectMessageSent] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  // Toggle card breakdown visibility
  const toggleCardExpansion = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Load Real Profiles from Supabase (with automatic graceful fallback if table missing or unauthenticated)
  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    setProfilesError('');
    setSchemaCacheError(false);

    if (!configured || !supabase) {
      setProfilesError('Supabase credentials are not configured yet.');
      setProfiles(FALLBACK_DEMO_PROFILES);
      setUsingDemoProfiles(true);
      setLoadingProfiles(false);
      return;
    }

    // RLS prevents anonymous users from reading public.profiles; show demo preview cleanly
    if (!user) {
      setProfiles(FALLBACK_DEMO_PROFILES);
      setUsingDemoProfiles(true);
      setLoadingProfiles(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        const msg = error.message || '';
        // Detect "schema cache" or table missing error (PGRST200 / relation does not exist)
        if (
          msg.includes('schema cache') ||
          msg.includes('Could not find the table') ||
          msg.includes('relation "public.profiles" does not exist') ||
          error.code === 'PGRST200'
        ) {
          setSchemaCacheError(true);
          setProfilesError(msg);
          setProfiles(FALLBACK_DEMO_PROFILES);
          setUsingDemoProfiles(true);
        } else {
          setProfilesError(msg);
          setProfiles([]);
          setUsingDemoProfiles(false);
        }
      } else {
        const validProfiles = (data || []).filter((p) => p.name && p.name.trim().length > 0);
        setProfiles(validProfiles);
        setUsingDemoProfiles(false);
      }
    } catch (err) {
      setProfilesError(err.message || 'Failed to fetch profiles.');
      setProfiles([]);
      setUsingDemoProfiles(false);
    } finally {
      setLoadingProfiles(false);
    }
  };

  // Load Listings from Supabase
  const fetchListings = async () => {
    if (!configured || !supabase) {
      setListingsError('Supabase is not configured yet.');
      setLoadingListings(false);
      return;
    }

    if (!user) {
      setListings([]);
      setLoadingListings(false);
      return;
    }

    setLoadingListings(true);
    setListingsError('');

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setListingsError(error.message);
      } else {
        setListings(data || []);
      }
    } catch (err) {
      setListingsError(err.message || 'Failed to fetch flat listings.');
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchProfiles();
    if (activeMode === 'listings') {
      fetchListings();
    }
  }, [user?.id, activeMode, authLoading]);

  // Handle Posting a Listing
  const handleCreateListing = async (e) => {
    e.preventDefault();
    setPostingError('');
    setPostingSuccess('');

    if (!user) {
      setPostingError('You must be signed in to post a listing.');
      return;
    }

    const rent = Number(newListing.monthly_rent);
    if (!newListing.title.trim()) {
      setPostingError('Title is required.');
      return;
    }
    if (!newListing.city.trim()) {
      setPostingError('City is required.');
      return;
    }
    if (isNaN(rent) || rent < 0) {
      setPostingError('Monthly rent must be a valid non-negative amount.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('listings')
        .insert({
          owner_id: user.id,
          title: newListing.title.trim(),
          city: newListing.city.trim(),
          locality: newListing.locality.trim() || null,
          monthly_rent: rent,
          description: newListing.description.trim() || null,
        })
        .select()
        .single();

      if (error) {
        setPostingError(error.message);
      } else {
        setListings((prev) => [data, ...prev]);
        setPostingSuccess('Listing published successfully!');
        setNewListing({
          title: '',
          city: '',
          locality: '',
          monthly_rent: '',
          description: '',
        });
        setTimeout(() => {
          setPostingSuccess('');
          setIsPostingListing(false);
        }, 1500);
      }
    } catch (err) {
      setPostingError(err.message || 'Failed to create listing.');
    }
  };

  // Base profile for matching (defaults to user's profile if signed in, or a balanced student profile)
  const referenceProfile = useMemo(() => {
    if (currentUserProfile) return currentUserProfile;
    if (user?.user_metadata) {
      return {
        name: user.user_metadata.name || 'You',
        min_budget: 700,
        max_budget: 1200,
        lifestyle: 'College Student',
        cleanliness_level: 'Balanced / Normal',
        food_preference: 'No Preference',
        sleep_schedule: 'Flexible',
      };
    }
    return {
      name: 'Default Match Profile',
      min_budget: 800,
      max_budget: 1200,
      lifestyle: 'College Student',
      cleanliness_level: 'Balanced / Normal',
      food_preference: 'No Preference',
      sleep_schedule: 'Flexible',
    };
  }, [currentUserProfile, user]);

  // Compute recommendation scores and filter profiles
  const processedProfiles = useMemo(() => {
    return profiles
      .map((candidate) => {
        const matchResult = calculateCompatibility(referenceProfile, candidate);
        return {
          ...candidate,
          match: matchResult,
        };
      })
      .filter((p) => {
        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name?.toLowerCase().includes(q);
          const matchBio = p.bio?.toLowerCase().includes(q);
          const matchCity = p.city?.toLowerCase().includes(q);
          const matchLocality = p.locality?.toLowerCase().includes(q);
          if (!matchName && !matchBio && !matchCity && !matchLocality) {
            return false;
          }
        }

        // City Filter
        if (filterCity.trim()) {
          if (!p.city || !p.city.toLowerCase().includes(filterCity.toLowerCase().trim())) {
            return false;
          }
        }

        // Locality Filter
        if (filterLocality.trim()) {
          if (!p.locality || !p.locality.toLowerCase().includes(filterLocality.toLowerCase().trim())) {
            return false;
          }
        }

        // Overlapping Budget Range Logic
        const pMin = p.min_budget !== null && p.min_budget !== undefined ? Number(p.min_budget) : 0;
        const pMax = p.max_budget !== null && p.max_budget !== undefined ? Number(p.max_budget) : Infinity;

        const fMin = filterMinBudget !== '' ? Number(filterMinBudget) : null;
        const fMax = filterMaxBudget !== '' ? Number(filterMaxBudget) : null;

        if (fMin !== null && fMax !== null) {
          if (!(pMin <= fMax && pMax >= fMin)) return false;
        } else if (fMin !== null) {
          if (pMax < fMin) return false;
        } else if (fMax !== null) {
          if (pMin > fMax) return false;
        }

        // Categorical Filters
        if (filterLifestyle !== 'All' && p.lifestyle !== filterLifestyle) return false;
        if (filterFood !== 'All' && p.food_preference !== filterFood) return false;
        if (filterCleanliness !== 'All' && p.cleanliness_level !== filterCleanliness) return false;
        if (filterSleep !== 'All' && p.sleep_schedule !== filterSleep) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'compatibility_desc') {
          return b.match.overallScore - a.match.overallScore;
        }
        if (sortBy === 'budget_asc') {
          const bA = a.min_budget ?? a.max_budget ?? 0;
          const bB = b.min_budget ?? b.max_budget ?? 0;
          return bA - bB;
        }
        if (sortBy === 'budget_desc') {
          const bA = a.max_budget ?? a.min_budget ?? 0;
          const bB = b.max_budget ?? b.min_budget ?? 0;
          return bB - bA;
        }
        if (sortBy === 'newest') {
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
        return 0;
      });
  }, [
    profiles,
    referenceProfile,
    searchQuery,
    filterCity,
    filterLocality,
    filterMinBudget,
    filterMaxBudget,
    filterFood,
    filterSleep,
    filterCleanliness,
    filterLifestyle,
    sortBy,
  ]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterCity('');
    setFilterLocality('');
    setFilterMinBudget('');
    setFilterMaxBudget('');
    setFilterFood('All');
    setFilterSleep('All');
    setFilterCleanliness('All');
    setFilterLifestyle('All');
    setSortBy('compatibility_desc');
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    filterCity ||
    filterLocality ||
    filterMinBudget ||
    filterMaxBudget ||
    filterFood !== 'All' ||
    filterSleep !== 'All' ||
    filterCleanliness !== 'All' ||
    filterLifestyle !== 'All'
  );

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top Header Banner */}
        <div className="relative mb-8 rounded-3xl border border-purple-900/40 bg-gradient-to-br from-navy-900/90 via-navy-950/80 to-purple-950/30 p-8 md:p-10 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/60 px-3.5 py-1 text-xs font-semibold text-purple-300 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Deterministic Compatibility Engine Active</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Discover Roommates & Flat Vacancies
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
                Ranked using our transparent multi-attribute compatibility algorithm: Budget (30%), Lifestyle (25%), Cleanliness (20%), Food (15%), and Sleep (10%).
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex rounded-xl bg-navy-950/90 p-1 border border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setActiveMode('profiles')}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
                    activeMode === 'profiles'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Roommates ({profiles.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('listings')}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
                    activeMode === 'listings'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building className="h-4 w-4" />
                  <span>Vacant Flats ({listings.length})</span>
                </button>
              </div>

              {activeMode === 'listings' && user && (
                <button
                  type="button"
                  onClick={() => setIsPostingListing(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Post Listing</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SCHEMA CACHE NOTICE & FIX GUIDE (Addresses screenshot issue directly) */}
        {schemaCacheError && (
          <div className="mb-8 rounded-2xl border border-amber-500/40 bg-navy-900/90 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
                <Database className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Supabase Setup Required: Table `public.profiles`</span>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                      Auto-fallback Enabled
                    </span>
                  </h3>
                  <button
                    onClick={fetchProfiles}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry Supabase Sync</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Supabase returned <code className="bg-black/40 text-amber-300 px-1.5 py-0.5 rounded font-mono">Could not find the table &apos;public.profiles&apos; in the schema cache</code>.
                  We have loaded <strong>Interactive Demo Profiles</strong> below so you can test the recommendation algorithm, filters, and UI immediately without waiting.
                </p>
                <div className="p-3.5 rounded-xl bg-navy-950/80 border border-purple-900/30 text-xs text-slate-300 space-y-1.5">
                  <p className="font-semibold text-purple-300 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    How to activate your real Supabase tables:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                    <li>Open your Supabase project &rarr; <strong>SQL Editor</strong>.</li>
                    <li>Copy and paste the code from <code className="text-purple-300 font-mono">supabase/schema.sql</code>.</li>
                    <li>Add this at the bottom to force PostgREST to refresh its cache: <code className="text-emerald-400 font-mono">NOTIFY pgrst, &apos;reload schema&apos;;</code>.</li>
                    <li>Click <strong>Run</strong>, then click <strong>Retry Supabase Sync</strong> above!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEMO PROFILES BANNER (when unauthenticated or previewing sample data) */}
        {!schemaCacheError && usingDemoProfiles && (
          <div className="mb-6 rounded-xl border border-purple-800/40 bg-purple-950/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-purple-300">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <span>
                {!user
                  ? 'Showing sample preview profiles. Sign in to view real verified users from Supabase.'
                  : 'Previewing interactive sample candidates with live compatibility scoring.'}
              </span>
            </span>
            <div className="flex items-center gap-3 flex-shrink-0">
              {!user ? (
                <Link href="/login" className="text-xs font-semibold text-white underline hover:text-purple-200">
                  Sign in &rarr;
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={fetchProfiles}
                  className="text-xs text-purple-200 underline hover:text-white"
                >
                  Show Live Supabase Data
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODE 1: PROFILES DISCOVERY */}
        {activeMode === 'profiles' && (
          <div>
            {/* Filter Bar */}
            <div className="mb-8 rounded-2xl border border-purple-900/40 bg-navy-900/80 p-5 md:p-6 backdrop-blur-xl shadow-xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Query */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, bio, vibes..."
                    className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* City Filter */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    placeholder="Filter by city (e.g. Austin)"
                    className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Locality Filter */}
                <div>
                  <input
                    type="text"
                    value={filterLocality}
                    onChange={(e) => setFilterLocality(e.target.value)}
                    placeholder="Locality / Campus area"
                    className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Sort By Dropdown */}
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="compatibility_desc">Sort by: Compatibility Score (High to Low)</option>
                    <option value="budget_asc">Budget: Low to High</option>
                    <option value="budget_desc">Budget: High to Low</option>
                    <option value="newest">Recently Joined</option>
                  </select>
                </div>
              </div>

              {/* Second Filter Row: Overlapping Budget & Preferences */}
              <div className="pt-2 border-t border-purple-900/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                {/* Budget Min */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                    Min $
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={filterMinBudget}
                    onChange={(e) => setFilterMinBudget(e.target.value)}
                    placeholder="Min budget"
                    className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 pl-14 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Budget Max */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                    Max $
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={filterMaxBudget}
                    onChange={(e) => setFilterMaxBudget(e.target.value)}
                    placeholder="Max budget"
                    className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 pl-14 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Food Preference */}
                <div>
                  <select
                    value={filterFood}
                    onChange={(e) => setFilterFood(e.target.value)}
                    className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="All">Food: Any Preference</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Eggetarian">Eggetarian</option>
                  </select>
                </div>

                {/* Sleep Schedule */}
                <div>
                  <select
                    value={filterSleep}
                    onChange={(e) => setFilterSleep(e.target.value)}
                    className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="All">Sleep: Any Routine</option>
                    <option value="Early Bird (before 11 PM)">Early Bird</option>
                    <option value="Night Owl (after 1 AM)">Night Owl</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>

                {/* Clear Filters CTA */}
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/40 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={fetchProfiles}
                    className="inline-flex items-center gap-1 rounded-xl border border-purple-800/40 bg-navy-950 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white"
                    title="Refresh from Supabase"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Count Bar & Personalized Matching Context */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>
                  Showing <strong className="text-purple-300">{processedProfiles.length}</strong> matching candidates
                </span>
                {user ? (
                  <span className="rounded-md bg-purple-950/70 border border-purple-800/30 px-2 py-0.5 text-[11px] text-purple-300">
                    Comparing against your saved profile
                  </span>
                ) : (
                  <Link
                    href="/login"
                    className="text-purple-400 underline hover:text-purple-300 ml-1"
                  >
                    Sign in to customize your match score
                  </Link>
                )}
              </div>

              {/* Algorithm Weights Summary Pill */}
              <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Algorithm:</span>
                <span>Budget 30%</span>
                <span>•</span>
                <span>Lifestyle 25%</span>
                <span>•</span>
                <span>Cleanliness 20%</span>
                <span>•</span>
                <span>Food 15%</span>
                <span>•</span>
                <span>Sleep 10%</span>
              </div>
            </div>

            {/* Error Banner (non-schema-cache error) */}
            {profilesError && !schemaCacheError && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/30 p-4 flex items-center justify-between gap-3 text-xs text-red-200">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span>Supabase query notice: {profilesError} (Showing interactive demo profiles)</span>
                </div>
                <button
                  type="button"
                  onClick={fetchProfiles}
                  className="rounded-lg bg-red-900/40 px-3 py-1.5 font-semibold hover:bg-red-800/50 flex-shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {loadingProfiles ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-purple-900/30 bg-navy-900/60 p-6 animate-pulse space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-purple-950/80" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-28 bg-purple-950/80 rounded" />
                        <div className="h-3 w-20 bg-purple-950/50 rounded" />
                      </div>
                    </div>
                    <div className="h-14 bg-purple-950/40 rounded-xl" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-purple-950/60 rounded" />
                      <div className="h-6 w-20 bg-purple-950/60 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : processedProfiles.length === 0 ? (
              /* Empty State */
              <div className="rounded-3xl border border-purple-900/40 bg-navy-900/60 p-12 text-center backdrop-blur-xl max-w-2xl mx-auto shadow-2xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 mb-4">
                  <Compass className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {hasActiveFilters
                    ? 'No Roommates Found Matching Your Criteria'
                    : 'No Other Roommate Profiles Found Yet'}
                </h3>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                  {hasActiveFilters
                    ? 'Try widening your minimum/maximum budget, clearing city/locality search terms, or resetting compatibility filters.'
                    : 'Only your profile is currently registered in Supabase. Once a second user creates a profile, they will appear here automatically.'}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 hover:opacity-95"
                    >
                      <X className="h-4 w-4" />
                      <span>Reset All Filters</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setProfiles(FALLBACK_DEMO_PROFILES);
                        setUsingDemoProfiles(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 hover:opacity-95"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Preview Sample Roommates</span>
                    </button>
                  )}
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 rounded-xl border border-purple-800/40 bg-navy-850 px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white"
                  >
                    <span>Update Your Own Profile</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Responsive Profile Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedProfiles.map((candidate) => {
                  const { match } = candidate;
                  const isExpanded = Boolean(expandedCards[candidate.id]);
                  const minB = candidate.min_budget;
                  const maxB = candidate.max_budget;

                  return (
                    <div
                      key={candidate.id}
                      className="group relative rounded-2xl border border-purple-900/40 bg-navy-900/80 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-purple-600/60 hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Avatar, Name & Overall Score Badge */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-purple-600/30">
                              {candidate.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">
                                {candidate.name}
                              </h3>
                              <p className="text-xs text-purple-300/80 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate max-w-[140px]">
                                  {candidate.locality ? `${candidate.locality}, ` : ''}
                                  {candidate.city || 'Location unlisted'}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Compatibility Score Badge */}
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold shadow-sm ${match.colorClass}`}
                            >
                              <Sparkles className="h-3 w-3" />
                              {match.overallScore}% Match
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-1 font-medium">
                              {match.tier}
                            </span>
                          </div>
                        </div>

                        {/* Budget Pill */}
                        <div className="mb-4 rounded-xl border border-purple-900/30 bg-navy-950/80 px-3.5 py-2.5 flex items-center justify-between">
                          <span className="text-xs text-slate-400">Monthly Budget</span>
                          <span className="text-sm font-bold text-emerald-400">
                            {(minB !== null && minB !== undefined) || (maxB !== null && maxB !== undefined)
                              ? `$${minB ?? 0} – $${maxB ?? 'open'}/mo`
                              : 'Flexible budget'}
                          </span>
                        </div>

                        {/* Lifestyle Attributes */}
                        <div className="mb-4 flex flex-wrap gap-1.5 text-[11px]">
                          {candidate.lifestyle && (
                            <span className="rounded-md bg-purple-950/70 border border-purple-800/40 px-2.5 py-1 text-purple-300 font-medium">
                              {candidate.lifestyle}
                            </span>
                          )}
                          {candidate.sleep_schedule && (
                            <span className="rounded-md bg-navy-850 border border-slate-700/50 px-2 py-1 text-slate-300">
                              {candidate.sleep_schedule}
                            </span>
                          )}
                          {candidate.food_preference && (
                            <span className="rounded-md bg-navy-850 border border-slate-700/50 px-2 py-1 text-slate-300">
                              {candidate.food_preference}
                            </span>
                          )}
                          {candidate.cleanliness_level && (
                            <span className="rounded-md bg-navy-850 border border-slate-700/50 px-2 py-1 text-slate-300">
                              {candidate.cleanliness_level}
                            </span>
                          )}
                        </div>

                        {/* Bio Excerpt */}
                        {candidate.bio && (
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4 italic">
                            &ldquo;{candidate.bio}&rdquo;
                          </p>
                        )}

                        {/* EXPLAINABILITY SECTION: Top Matching & Mismatching Factors */}
                        <div className="rounded-xl border border-purple-900/30 bg-navy-950/60 p-3 mb-4 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                            <span className="flex items-center gap-1.5 text-purple-300">
                              <TrendingUp className="h-3.5 w-3.5" />
                              Why you match:
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleCardExpansion(candidate.id)}
                              className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
                            >
                              <span>{isExpanded ? 'Hide breakdown' : 'View breakdown'}</span>
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                          </div>

                          {/* Top Strengths */}
                          {match.strengths.slice(0, 2).map((s, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-emerald-300/90 leading-tight">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <span>{s}</span>
                            </div>
                          ))}

                          {/* Top Friction/Mismatch Points */}
                          {match.friction.slice(0, 1).map((f, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-300/90 leading-tight">
                              <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5 flex-shrink-0" />
                              <span>{f}</span>
                            </div>
                          ))}

                          {/* Expandable 5-Factor Weighted Component Breakdown */}
                          {isExpanded && (
                            <div className="pt-2.5 mt-2 border-t border-purple-900/30 space-y-1.5 text-[10px]">
                              <div className="flex justify-between items-center text-slate-400">
                                <span>Budget Overlap (30%)</span>
                                <span className="font-semibold text-white">{match.breakdown.budgetScore}/100</span>
                              </div>
                              <div className="w-full bg-navy-900 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-1.5 rounded-full"
                                  style={{ width: `${match.breakdown.budgetScore}%` }}
                                />
                              </div>

                              <div className="flex justify-between items-center text-slate-400 pt-1">
                                <span>Lifestyle (25%)</span>
                                <span className="font-semibold text-white">{match.breakdown.lifestyleScore}/100</span>
                              </div>
                              <div className="w-full bg-navy-900 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-purple-500 h-1.5 rounded-full"
                                  style={{ width: `${match.breakdown.lifestyleScore}%` }}
                                />
                              </div>

                              <div className="flex justify-between items-center text-slate-400 pt-1">
                                <span>Cleanliness (20%)</span>
                                <span className="font-semibold text-white">{match.breakdown.cleanlinessScore}/100</span>
                              </div>
                              <div className="w-full bg-navy-900 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-indigo-500 h-1.5 rounded-full"
                                  style={{ width: `${match.breakdown.cleanlinessScore}%` }}
                                />
                              </div>

                              <div className="flex justify-between items-center text-slate-400 pt-1">
                                <span>Food Habits (15%)</span>
                                <span className="font-semibold text-white">{match.breakdown.foodScore}/100</span>
                              </div>
                              <div className="w-full bg-navy-900 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: `${match.breakdown.foodScore}%` }}
                                />
                              </div>

                              <div className="flex justify-between items-center text-slate-400 pt-1">
                                <span>Sleep Routine (10%)</span>
                                <span className="font-semibold text-white">{match.breakdown.sleepScore}/100</span>
                              </div>
                              <div className="w-full bg-navy-900 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-pink-500 h-1.5 rounded-full"
                                  style={{ width: `${match.breakdown.sleepScore}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action Button */}
                      <div className="pt-3 border-t border-purple-900/30">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProfile(candidate);
                            setConnectMessageSent(false);
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-purple-700/50 bg-navy-950/80 px-4 py-2.5 text-xs font-semibold text-purple-200 transition-all hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 hover:text-white hover:border-transparent shadow-sm"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>View Full Analysis & Connect</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: LISTINGS BROWSER */}
        {activeMode === 'listings' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Flat & Room Vacancies</h2>
                <p className="text-xs text-slate-400">
                  Apartments and shared rooms posted by community members.
                </p>
              </div>

              {user && (
                <button
                  type="button"
                  onClick={() => setIsPostingListing(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 shadow-md transition-all"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Post Vacancy</span>
                </button>
              )}
            </div>

            {listingsError && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/30 p-4 flex items-center justify-between gap-3 text-xs text-red-200">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span>Failed to load listings: {listingsError}</span>
                </div>
                <button
                  type="button"
                  onClick={fetchListings}
                  className="rounded-lg bg-red-900/40 px-3 py-1.5 font-semibold hover:bg-red-800/50 flex-shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {loadingListings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-navy-900/60 border border-purple-900/30 animate-pulse" />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-3xl border border-purple-900/40 bg-navy-900/60 p-12 text-center backdrop-blur-xl max-w-2xl mx-auto shadow-2xl">
                <Building className="mx-auto h-12 w-12 text-purple-400/60 mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">No Vacancies Posted Yet</h3>
                <p className="text-sm text-slate-300 mb-6">
                  Have a spare bedroom or looking for a roommate to split a flat? Post the first vacancy!
                </p>
                {user ? (
                  <button
                    type="button"
                    onClick={() => setIsPostingListing(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Create a Listing</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg"
                  >
                    <span>Sign in to Post</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-2xl border border-purple-900/40 bg-navy-900/80 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-white text-base">{l.title}</h3>
                        <span className="text-base font-extrabold text-emerald-400">
                          ${Number(l.monthly_rent).toFixed(0)}/mo
                        </span>
                      </div>

                      <p className="text-xs text-purple-300 flex items-center gap-1 mb-3">
                        <MapPin className="h-3 w-3" />
                        {l.locality ? `${l.locality}, ` : ''}{l.city}
                      </p>

                      {l.description && (
                        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                          {l.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-purple-900/30 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Posted by verified owner</span>
                      <span>{new Date(l.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL: POST LISTING FORM */}
        {isPostingListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-purple-900/50 bg-navy-900 p-6 md:p-8 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building className="h-5 w-5 text-purple-400" />
                  <span>Post Flat Vacancy</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsPostingListing(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {postingSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
                  {postingSuccess}
                </div>
              )}

              {postingError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  {postingError}
                </div>
              )}

              <form onSubmit={handleCreateListing} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="l-title">
                    Listing Title
                  </label>
                  <input
                    id="l-title"
                    type="text"
                    required
                    value={newListing.title}
                    onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                    placeholder="e.g. Master Bedroom in 2BHK Near Campus"
                    className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="l-city">
                      City
                    </label>
                    <input
                      id="l-city"
                      type="text"
                      required
                      value={newListing.city}
                      onChange={(e) => setNewListing({ ...newListing, city: e.target.value })}
                      placeholder="e.g. Austin"
                      className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="l-rent">
                      Monthly Rent ($)
                    </label>
                    <input
                      id="l-rent"
                      type="number"
                      min="0"
                      step="25"
                      required
                      value={newListing.monthly_rent}
                      onChange={(e) => setNewListing({ ...newListing, monthly_rent: e.target.value })}
                      placeholder="750"
                      className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="l-locality">
                    Locality / Campus Neighborhood
                  </label>
                  <input
                    id="l-locality"
                    type="text"
                    value={newListing.locality}
                    onChange={(e) => setNewListing({ ...newListing, locality: e.target.value })}
                    placeholder="e.g. West Campus / 24th Street"
                    className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="l-desc">
                    Description & Amenities
                  </label>
                  <textarea
                    id="l-desc"
                    rows={3}
                    value={newListing.description}
                    onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                    placeholder="Includes high-speed WiFi, washer/dryer, dedicated parking spot..."
                    className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPostingListing(false)}
                    className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/30"
                  >
                    Publish Listing
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: FULL COMPATIBILITY REPORT & CONNECT */}
        {selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-purple-900/50 bg-navy-900 p-6 md:p-8 shadow-2xl space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-purple-900/30">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-lg">
                    {selectedProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{selectedProfile.name}</h3>
                    <p className="text-xs text-purple-300 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedProfile.locality ? `${selectedProfile.locality}, ` : ''}{selectedProfile.city}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProfile(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Match Score Banner */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-navy-950/80 border border-purple-900/40">
                <div>
                  <span className="text-xs text-slate-400 block">Deterministic Compatibility:</span>
                  <span className="text-xl font-extrabold text-white">
                    {selectedProfile.match.overallScore}%
                  </span>
                  <span className="text-xs text-purple-300 ml-2">({selectedProfile.match.tier})</span>
                </div>
                <span className={`px-3 py-1 rounded-full border text-xs font-bold ${selectedProfile.match.colorClass}`}>
                  Weighted Multi-Attribute Match
                </span>
              </div>

              {/* Compatibility Breakdown Bars */}
              <div className="rounded-xl bg-navy-950/80 border border-purple-900/40 p-4 space-y-2 text-xs">
                <span className="text-xs font-semibold text-purple-300 block mb-2">
                  Factor-by-Factor Evaluation:
                </span>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                      <span>Budget Overlap (Weight 30%):</span>
                      <span className="font-bold text-emerald-400">{selectedProfile.match.breakdown.budgetScore}/100</span>
                    </div>
                    <div className="w-full bg-navy-900 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${selectedProfile.match.breakdown.budgetScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                      <span>Lifestyle Alignment (Weight 25%):</span>
                      <span className="font-bold text-purple-300">{selectedProfile.match.breakdown.lifestyleScore}/100</span>
                    </div>
                    <div className="w-full bg-navy-900 rounded-full h-1.5">
                      <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${selectedProfile.match.breakdown.lifestyleScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                      <span>Cleanliness Habits (Weight 20%):</span>
                      <span className="font-bold text-indigo-300">{selectedProfile.match.breakdown.cleanlinessScore}/100</span>
                    </div>
                    <div className="w-full bg-navy-900 rounded-full h-1.5">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${selectedProfile.match.breakdown.cleanlinessScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                      <span>Food Preferences (Weight 15%):</span>
                      <span className="font-bold text-blue-300">{selectedProfile.match.breakdown.foodScore}/100</span>
                    </div>
                    <div className="w-full bg-navy-900 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${selectedProfile.match.breakdown.foodScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                      <span>Sleep Routine (Weight 10%):</span>
                      <span className="font-bold text-pink-300">{selectedProfile.match.breakdown.sleepScore}/100</span>
                    </div>
                    <div className="w-full bg-navy-900 rounded-full h-1.5">
                      <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${selectedProfile.match.breakdown.sleepScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio & Habits */}
              {selectedProfile.bio && (
                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-1">About:</span>
                  <p className="text-xs text-slate-300 leading-relaxed italic bg-purple-950/20 p-3 rounded-xl border border-purple-900/30">
                    &ldquo;{selectedProfile.bio}&rdquo;
                  </p>
                </div>
              )}

              {/* Privacy Notice */}
              <div className="rounded-xl border border-purple-800/30 bg-purple-950/40 p-3 text-[11px] text-purple-200 flex items-start gap-2">
                <Shield className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy Protected:</strong> Direct phone numbers and email addresses are shielded to prevent spam. Roommate introductions are processed through verified accounts.
                </span>
              </div>

              {connectMessageSent ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Introduction request sent! {selectedProfile.name} will be notified.</span>
                </div>
              ) : (
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProfile(null)}
                    className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectMessageSent(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-600/30"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Send Roommate Request</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
