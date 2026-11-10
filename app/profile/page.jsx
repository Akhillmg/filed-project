'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  MapPin,
  DollarSign,
  Utensils,
  Sparkles,
  Moon,
  Briefcase,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  PlusCircle,
  Receipt,
  Trash2,
  ShieldCheck,
  Eye,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { formatINR } from '@/lib/expenseCalculator';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, updateProfile, refreshProfile, isConfigured } = useAuth();

  // Profile Form State
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    locality: '',
    min_budget: '',
    max_budget: '',
    food_preference: 'No Preference',
    cleanliness_level: 'Balanced / Normal',
    sleep_schedule: 'Flexible',
    lifestyle: 'College Student',
    bio: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Expenses State (to demonstrate strict owner-only RLS policy)
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseParticipants, setNewExpenseParticipants] = useState('2');
  const [expenseError, setExpenseError] = useState('');
  const [expenseSuccess, setExpenseSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'expenses'

  // Pre-fill form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        city: profile.city || '',
        locality: profile.locality || '',
        min_budget: profile.min_budget ?? '',
        max_budget: profile.max_budget ?? '',
        food_preference: profile.food_preference || 'No Preference',
        cleanliness_level: profile.cleanliness_level || 'Balanced / Normal',
        sleep_schedule: profile.sleep_schedule || 'Flexible',
        lifestyle: profile.lifestyle || 'College Student',
        bio: profile.bio || '',
      });
    } else if (user?.user_metadata?.name) {
      setFormData((prev) => ({
        ...prev,
        name: user.user_metadata.name,
      }));
    }
  }, [profile, user]);

  // Load private expenses for the current user
  useEffect(() => {
    if (!user || !supabase) return;

    let isMounted = true;
    async function loadExpenses() {
      setLoadingExpenses(true);
      setExpenseError('');
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error && isMounted) {
          setExpenseError(error.message);
        } else if (isMounted) {
          setExpenses(data || []);
        }
      } catch (err) {
        if (isMounted) setExpenseError(err.message || 'Error fetching expenses.');
      } finally {
        if (isMounted) setLoadingExpenses(false);
      }
    }

    loadExpenses();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Comprehensive field validation
  const validateForm = () => {
    const errors = {};

    // 1. Name validation
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long.';
    } else if (formData.name.trim().length > 70) {
      errors.name = 'Name cannot exceed 70 characters.';
    }

    // 2. City validation
    if (!formData.city || !formData.city.trim()) {
      errors.city = 'City is required so flatmates can discover your profile.';
    } else if (formData.city.trim().length < 2) {
      errors.city = 'Please enter a valid city name.';
    }

    // 3. Locality validation
    if (formData.locality && formData.locality.trim().length > 80) {
      errors.locality = 'Locality / campus area must be under 80 characters.';
    }

    // 4. Budget range validation
    const minB = formData.min_budget === '' || formData.min_budget === null ? null : Number(formData.min_budget);
    const maxB = formData.max_budget === '' || formData.max_budget === null ? null : Number(formData.max_budget);

    if (minB !== null) {
      if (isNaN(minB) || minB < 0) {
        errors.min_budget = 'Minimum budget must be a positive number or zero.';
      }
    }

    if (maxB !== null) {
      if (isNaN(maxB) || maxB < 0) {
        errors.max_budget = 'Maximum budget must be a positive number or zero.';
      }
    }

    if (minB !== null && maxB !== null && minB > maxB) {
      errors.budget_range = 'Minimum budget cannot exceed Maximum budget.';
      errors.min_budget = 'Min budget exceeds max.';
      errors.max_budget = 'Max budget must be greater than or equal to min.';
    }

    // 5. Bio validation
    if (formData.bio && formData.bio.length > 800) {
      errors.bio = 'Bio is too long (maximum 800 characters).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-sm text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Protected route guard: not authenticated
  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-purple-900/40 bg-navy-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-sm text-slate-300 mb-6">
            You must be signed in with a FlatMate AI account to view and manage your profile.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 hover:opacity-95"
            >
              Sign In to Your Account
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-purple-800/40 bg-navy-850 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white"
            >
              Create a New Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle Profile Update
  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    if (!validateForm()) {
      setSaveError('Please resolve the errors highlighted below.');
      return;
    }

    setSaving(true);

    const { error } = await updateProfile(formData);

    setSaving(false);

    if (error) {
      setSaveError(error.message || 'Failed to update profile.');
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
      refreshProfile();
    }
  };

  // Handle Adding Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpenseError('');
    setExpenseSuccess('');

    const amount = Number(newExpenseAmount);
    const count = Number(newExpenseParticipants);

    if (!newExpenseTitle.trim()) {
      setExpenseError('Please enter an expense title.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setExpenseError('Expense amount must be greater than zero.');
      return;
    }
    if (!Number.isFinite(count) || !Number.isInteger(count) || count < 1) {
      setExpenseError('Participant count must be a positive whole number (at least 1).');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          owner_id: user.id,
          title: newExpenseTitle.trim(),
          amount: amount,
          participant_count: count,
        })
        .select()
        .single();

      if (error) {
        setExpenseError(error.message);
      } else {
        setExpenses((prev) => [data, ...prev]);
        setNewExpenseTitle('');
        setNewExpenseAmount('');
        setNewExpenseParticipants('2');
        setExpenseSuccess('Expense logged! Visible only to you.');
        setTimeout(() => setExpenseSuccess(''), 3000);
      }
    } catch (err) {
      setExpenseError(err.message || 'Failed to add expense.');
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        setExpenseError(error.message);
      } else {
        setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      }
    } catch (err) {
      setExpenseError(err.message || 'Failed to delete expense.');
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Top Header Card */}
        <div className="relative mb-8 rounded-2xl border border-purple-900/40 bg-navy-900/80 p-6 md:p-8 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-purple-600/30">
                {(formData.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                    {formData.name || 'Setup Your Profile'}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    Authenticated
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 break-all">
                  User ID: <code className="font-mono text-purple-300">{user.id}</code>
                </p>
                <p className="text-xs text-slate-400 break-all">
                  Private Auth Email: <span className="text-slate-300">{user.email}</span> (Protected from public view)
                </p>
              </div>
            </div>

            {/* Navigation & Tabs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/discover"
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-600/50 bg-purple-950/40 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-900/50 hover:text-white transition-all"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Go to Discover</span>
                <ArrowRight className="h-3 w-3" />
              </Link>

              <div className="flex rounded-xl bg-navy-950/80 p-1 border border-purple-900/30">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                    activeTab === 'profile'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Profile Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('expenses')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                    activeTab === 'expenses'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Private Expenses ({expenses.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: Profile Settings */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-8">
              <form onSubmit={handleSubmitProfile} className="rounded-2xl border border-purple-900/40 bg-navy-900/80 p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Roommate Preferences & Lifestyle</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Keep your details accurate so potential flatmates can discover and match with you.
                  </p>
                </div>

                {saveSuccess && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs font-medium text-emerald-200 animate-fadeIn">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>Your profile has been saved successfully in Supabase!</span>
                  </div>
                )}

                {saveError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-200">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="p-name">
                    Display Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="p-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null });
                      }}
                      placeholder="e.g. Alex Johnson"
                      className={`w-full rounded-xl border bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                        fieldErrors.name
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-purple-900/40 focus:border-purple-500'
                      }`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-[11px] text-red-400 mt-1">{fieldErrors.name}</p>
                  )}
                </div>

                {/* City & Locality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="p-city">
                      Target City <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <input
                        id="p-city"
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => {
                          setFormData({ ...formData, city: e.target.value });
                          if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: null });
                        }}
                        placeholder="e.g. Austin, TX"
                        className={`w-full rounded-xl border bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                          fieldErrors.city
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-purple-900/40 focus:border-purple-500'
                        }`}
                      />
                    </div>
                    {fieldErrors.city && (
                      <p className="text-[11px] text-red-400 mt-1">{fieldErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="p-locality">
                      Locality / Campus Area
                    </label>
                    <input
                      id="p-locality"
                      type="text"
                      value={formData.locality}
                      onChange={(e) => {
                        setFormData({ ...formData, locality: e.target.value });
                        if (fieldErrors.locality) setFieldErrors({ ...fieldErrors, locality: null });
                      }}
                      placeholder="e.g. West Campus / Downtown"
                      className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                    {fieldErrors.locality && (
                      <p className="text-[11px] text-red-400 mt-1">{fieldErrors.locality}</p>
                    )}
                  </div>
                </div>

                {/* Budget Range */}
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="p-min-budget">
                        Min Budget ($ / month)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <input
                          id="p-min-budget"
                          type="number"
                          min="0"
                          step="50"
                          value={formData.min_budget}
                          onChange={(e) => {
                            setFormData({ ...formData, min_budget: e.target.value });
                            if (fieldErrors.min_budget || fieldErrors.budget_range) {
                              setFieldErrors({ ...fieldErrors, min_budget: null, budget_range: null });
                            }
                          }}
                          placeholder="500"
                          className={`w-full rounded-xl border bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                            fieldErrors.min_budget
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-purple-900/40 focus:border-purple-500'
                          }`}
                        />
                      </div>
                      {fieldErrors.min_budget && (
                        <p className="text-[11px] text-red-400 mt-1">{fieldErrors.min_budget}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="p-max-budget">
                        Max Budget ($ / month)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <input
                          id="p-max-budget"
                          type="number"
                          min="0"
                          step="50"
                          value={formData.max_budget}
                          onChange={(e) => {
                            setFormData({ ...formData, max_budget: e.target.value });
                            if (fieldErrors.max_budget || fieldErrors.budget_range) {
                              setFieldErrors({ ...fieldErrors, max_budget: null, budget_range: null });
                            }
                          }}
                          placeholder="1200"
                          className={`w-full rounded-xl border bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                            fieldErrors.max_budget
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-purple-900/40 focus:border-purple-500'
                          }`}
                        />
                      </div>
                      {fieldErrors.max_budget && (
                        <p className="text-[11px] text-red-400 mt-1">{fieldErrors.max_budget}</p>
                      )}
                    </div>
                  </div>
                  {fieldErrors.budget_range && (
                    <p className="text-[11px] text-red-400 mt-1">{fieldErrors.budget_range}</p>
                  )}
                </div>

                {/* Compatibility Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="p-food">
                      Food Preference
                    </label>
                    <select
                      id="p-food"
                      value={formData.food_preference}
                      onChange={(e) => setFormData({ ...formData, food_preference: e.target.value })}
                      className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="No Preference">No Preference</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Non-Vegetarian">Non-Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Eggetarian">Eggetarian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="p-cleanliness">
                      Cleanliness Level
                    </label>
                    <select
                      id="p-cleanliness"
                      value={formData.cleanliness_level}
                      onChange={(e) => setFormData({ ...formData, cleanliness_level: e.target.value })}
                      className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="Highly Organized & Clean">Highly Organized & Clean</option>
                      <option value="Balanced / Normal">Balanced / Normal</option>
                      <option value="Relaxed / Laid-back">Relaxed / Laid-back</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="p-sleep">
                      Sleep Schedule
                    </label>
                    <select
                      id="p-sleep"
                      value={formData.sleep_schedule}
                      onChange={(e) => setFormData({ ...formData, sleep_schedule: e.target.value })}
                      className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="Early Bird (before 11 PM)">Early Bird (before 11 PM)</option>
                      <option value="Night Owl (after 1 AM)">Night Owl (after 1 AM)</option>
                      <option value="Flexible">Flexible / Mixed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="p-lifestyle">
                      Lifestyle / Status
                    </label>
                    <select
                      id="p-lifestyle"
                      value={formData.lifestyle}
                      onChange={(e) => setFormData({ ...formData, lifestyle: e.target.value })}
                      className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="College Student">College Student</option>
                      <option value="Working Professional">Working Professional</option>
                      <option value="Remote / Freelancer">Remote / Freelancer</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-medium text-slate-300" htmlFor="p-bio">
                      About Me / Bio
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {(formData.bio || '').length}/800
                    </span>
                  </div>
                  <textarea
                    id="p-bio"
                    rows={4}
                    maxLength={800}
                    value={formData.bio}
                    onChange={(e) => {
                      setFormData({ ...formData, bio: e.target.value });
                      if (fieldErrors.bio) setFieldErrors({ ...fieldErrors, bio: null });
                    }}
                    placeholder="Tell prospective flatmates about your study habits, hobbies, cleanliness habits, and what you are looking for in an apartment..."
                    className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                  {fieldErrors.bio && (
                    <p className="text-[11px] text-red-400 mt-1">{fieldErrors.bio}</p>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition-all duration-200 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving in Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/discover"
                    className="text-xs text-slate-400 hover:text-purple-300 transition-colors"
                  >
                    Explore other roommates &rarr;
                  </Link>
                </div>
              </form>
            </div>

            {/* Sidebar Preview Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl border border-purple-900/40 bg-navy-900/80 p-6 backdrop-blur-xl shadow-xl">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-4">
                  <Eye className="h-4 w-4" />
                  <span>Public Discovery Card</span>
                </div>

                <div className="rounded-xl border border-purple-800/40 bg-navy-950/90 p-5 space-y-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-purple-500/20">
                      {(formData.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {formData.name || 'Your Name'}
                      </h3>
                      <p className="text-xs text-purple-300 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {formData.locality ? `${formData.locality}, ` : ''}{formData.city || 'Location not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-md bg-purple-950/80 border border-purple-800/40 px-2.5 py-0.5 text-purple-300 font-medium">
                      {formData.lifestyle}
                    </span>
                    <span className="rounded-md bg-navy-850 border border-slate-700/50 px-2.5 py-0.5 text-slate-300">
                      {formData.sleep_schedule}
                    </span>
                    <span className="rounded-md bg-navy-850 border border-slate-700/50 px-2.5 py-0.5 text-slate-300">
                      {formData.food_preference}
                    </span>
                  </div>

                  <div className="border-t border-purple-900/30 pt-3">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Budget Expectation:</span>
                    <span className="text-sm font-semibold text-emerald-400">
                      {(formData.min_budget !== '' && formData.min_budget !== null) ||
                      (formData.max_budget !== '' && formData.max_budget !== null)
                        ? `$${formData.min_budget !== '' && formData.min_budget !== null ? formData.min_budget : 0} – $${formData.max_budget !== '' && formData.max_budget !== null ? formData.max_budget : 'open'}/month`
                        : 'Budget open'}
                    </span>
                  </div>

                  {formData.bio && (
                    <p className="text-xs text-slate-300 italic border-t border-purple-900/30 pt-3 line-clamp-3 leading-relaxed">
                      &ldquo;{formData.bio}&rdquo;
                    </p>
                  )}
                </div>

                <div className="mt-4 rounded-xl bg-purple-950/40 border border-purple-800/30 p-3 text-[11px] text-purple-300 leading-relaxed">
                  <span className="font-semibold text-white block mb-0.5">Privacy Notice:</span>
                  Your account email and contact phone numbers are never stored in the public profiles table or returned by public queries.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Private Expenses */}
        {activeTab === 'expenses' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Add Expense Form */}
            <div className="lg:col-span-5">
              <form onSubmit={handleAddExpense} className="rounded-2xl border border-purple-900/40 bg-navy-900/80 p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-purple-400" />
                    <span>Log New Expense</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Protected by Supabase Row Level Security. Only you (<code className="text-purple-300 font-mono">auth.uid()</code>) can read or modify these records.
                  </p>
                </div>

                {expenseSuccess && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>{expenseSuccess}</span>
                  </div>
                )}

                {expenseError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span>{expenseError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="exp-title">
                    Expense Title
                  </label>
                  <input
                    id="exp-title"
                    type="text"
                    required
                    value={newExpenseTitle}
                    onChange={(e) => setNewExpenseTitle(e.target.value)}
                    placeholder="e.g. WiFi Bill / Grocery Run"
                    className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="exp-amount">
                      Total Amount (₹)
                    </label>
                    <input
                      id="exp-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={newExpenseAmount}
                      onChange={(e) => setNewExpenseAmount(e.target.value)}
                      placeholder="1500.00"
                      className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="exp-participants">
                      Participants
                    </label>
                    <input
                      id="exp-participants"
                      type="number"
                      min="1"
                      required
                      value={newExpenseParticipants}
                      onChange={(e) => setNewExpenseParticipants(e.target.value)}
                      placeholder="2"
                      className="w-full rounded-xl border border-purple-900/40 bg-navy-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 hover:opacity-95"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Save Private Expense</span>
                </button>

                <div className="pt-2 text-center">
                  <Link href="/expenses" className="text-xs text-purple-300 hover:text-purple-200 underline">
                    Need to split rent, electricity, Wi-Fi & groceries? Open Full Calculator &rarr;
                  </Link>
                </div>
              </form>
            </div>

            {/* Expenses List */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-purple-900/40 bg-navy-900/80 p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-purple-400" />
                    <span>Your Logged Expenses</span>
                  </h3>
                  <span className="text-xs text-slate-400">{expenses.length} records</span>
                </div>

                {loadingExpenses ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                  </div>
                ) : expenses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-purple-900/40 p-8 text-center">
                    <Receipt className="mx-auto h-10 w-10 text-slate-500 mb-3" />
                    <p className="text-sm text-slate-300 font-medium">No expenses recorded yet.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Log your first apartment expense using the form on the left.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between rounded-xl border border-purple-900/30 bg-navy-950/70 p-4 transition-all hover:border-purple-800/60"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-white">{exp.title}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Split {exp.participant_count} ways: {formatINR(Number(exp.amount) / exp.participant_count)}/person
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-base font-bold text-emerald-400">
                            {formatINR(exp.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
