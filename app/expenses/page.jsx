'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calculator,
  Receipt,
  Users,
  Zap,
  Wifi,
  ShoppingBag,
  MoreHorizontal,
  Home,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Info,
  ArrowRight,
  Database,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  calculateExpenseSplit,
  calculatePerPersonFromTotal,
  formatINR,
} from '@/lib/expenseCalculator';

export default function ExpensesPage() {
  const { user, loading: authLoading } = useAuth();
  const configured = isSupabaseConfigured();

  // Calculator Form State
  const [calculationTitle, setCalculationTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [rent, setRent] = useState('');
  const [electricity, setElectricity] = useState('');
  const [wifi, setWifi] = useState('');
  const [groceries, setGroceries] = useState('');
  const [misc, setMisc] = useState('');
  const [flatmates, setFlatmates] = useState('3');

  // Interactive Live Calculation
  const calculation = useMemo(() => {
    return calculateExpenseSplit({
      rent,
      electricity,
      wifi,
      groceries,
      misc,
      flatmates,
    });
  }, [rent, electricity, wifi, groceries, misc, flatmates]);

  // Saved Calculations State (from Supabase expenses table)
  const [savedExpenses, setSavedExpenses] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [schemaMissing, setSchemaMissing] = useState(false);

  // Saving & Deleting States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Fetch saved calculations for the signed-in user
  const fetchSavedExpenses = async () => {
    if (authLoading) return;

    if (!user || !supabase || !configured) {
      setSavedExpenses([]);
      setLoadingSaved(false);
      return;
    }

    setLoadingSaved(true);
    setFetchError('');
    setSchemaMissing(false);

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        const msg = error.message || '';
        if (
          msg.includes('schema cache') ||
          msg.includes('Could not find the table') ||
          msg.includes('relation "public.expenses" does not exist')
        ) {
          setSchemaMissing(true);
        }
        setFetchError(msg);
      } else {
        setSavedExpenses(data || []);
      }
    } catch (err) {
      setFetchError(err.message || 'Failed to fetch saved calculations.');
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    fetchSavedExpenses();
  }, [user?.id, configured, authLoading]);

  // Handle Save Calculation to Supabase expenses table
  const handleSaveCalculation = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    setTitleError('');

    if (!user) {
      setSaveError('You must be signed in to save expense calculations to your account.');
      return;
    }

    if (!configured || !supabase) {
      setSaveError('Supabase credentials are not configured yet.');
      return;
    }

    if (!calculation.isValid) {
      setSaveError('Please resolve the invalid amounts or participant count before saving.');
      return;
    }

    if (calculation.total <= 0) {
      setSaveError('Enter at least one monthly expense greater than ₹0 before saving.');
      return;
    }

    const trimmedTitle = calculationTitle.trim();
    if (!trimmedTitle) {
      setTitleError('Please provide a name for this calculation (e.g. "November Flat Split").');
      setSaveError('Please name your calculation before saving.');
      return;
    }

    if (trimmedTitle.length > 120) {
      setTitleError('Calculation name must be 120 characters or fewer.');
      return;
    }

    setIsSaving(true);

    try {
      // Strictly adheres to existing Supabase schema:
      // expenses(owner_id, title, amount, participant_count)
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          owner_id: user.id,
          title: trimmedTitle,
          amount: calculation.total,
          participant_count: calculation.flatmates,
        })
        .select()
        .single();

      if (error) {
        setSaveError(error.message);
      } else {
        setSavedExpenses((prev) => [data, ...prev]);
        setSaveSuccess(`"${trimmedTitle}" saved to your account!`);
        setCalculationTitle('');
        setTimeout(() => setSaveSuccess(''), 4000);
      }
    } catch (err) {
      setSaveError(err.message || 'Failed to save calculation.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Calculation
  const handleDeleteCalculation = async (id) => {
    if (!user || !supabase) return;
    setDeletingId(id);
    setSaveError('');

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        setSaveError(error.message);
      } else {
        setSavedExpenses((prev) => prev.filter((exp) => exp.id !== id));
      }
    } catch (err) {
      setSaveError(err.message || 'Failed to delete calculation.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top Header Banner */}
        <div className="relative mb-8 rounded-3xl border border-purple-900/40 bg-gradient-to-br from-navy-900/90 via-navy-950/80 to-purple-950/30 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/60 px-3.5 py-1 text-xs font-semibold text-purple-300 mb-3">
                <Calculator className="h-3.5 w-3.5 text-purple-400" />
                <span>Rent &amp; Shared Living Splitter</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Flat Expense Calculator (₹ INR)
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
                Accurately divide monthly rent, electricity, Wi-Fi, groceries, and shared flat bills equally among flatmates with paise-exact rounding in Indian rupees.
              </p>
            </div>

            {/* Planning Disclaimer Pill */}
            <div className="rounded-2xl border border-purple-900/40 bg-navy-950/80 p-4 max-w-xs text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                <Info className="h-4 w-4 text-purple-400 flex-shrink-0" />
                <span>Planning &amp; Budgeting Tool</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Calculations help flatmates plan monthly contributions. FlatMate AI does not process payments or transfer money.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Expense Splitting Calculator Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSaveCalculation}
              className="rounded-3xl border border-purple-900/40 bg-navy-900/80 p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-purple-400" />
                  <span>Monthly Expenses Breakdown</span>
                </h2>
                <span className="text-xs text-purple-300 font-medium">All figures in ₹ (INR)</span>
              </div>

              {saveSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3.5 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {saveError && (
                <div className="flex items-start gap-2 rounded-xl bg-red-950/40 border border-red-500/30 p-3.5 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* 1. Number of Flatmates */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="exp-flatmates">
                  Number of Flatmates Sharing Cost <span className="text-purple-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Users className="h-4 w-4 text-purple-400" />
                  </div>
                  <input
                    id="exp-flatmates"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={flatmates}
                    onChange={(e) => setFlatmates(e.target.value)}
                    placeholder="3"
                    className={`w-full rounded-xl border bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                      calculation.errors.flatmates
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-purple-900/40 focus:border-purple-500'
                    }`}
                  />
                </div>
                {calculation.errors.flatmates && (
                  <p className="text-[11px] text-red-400 mt-1">{calculation.errors.flatmates}</p>
                )}
              </div>

              {/* 2. Monthly Rent */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="exp-rent">
                  Monthly Apartment Rent (₹)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm font-bold">
                    ₹
                  </div>
                  <input
                    id="exp-rent"
                    type="number"
                    min="0"
                    step="0.01"
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    placeholder="e.g. 24000"
                    className={`w-full rounded-xl border bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                      calculation.errors.rent
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-purple-900/40 focus:border-purple-500'
                    }`}
                  />
                </div>
                {calculation.errors.rent && (
                  <p className="text-[11px] text-red-400 mt-1">{calculation.errors.rent}</p>
                )}
              </div>

              {/* 3. Utility Bills Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="exp-elec">
                    Electricity Bill (₹)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Zap className="h-4 w-4 text-amber-400" />
                    </div>
                    <input
                      id="exp-elec"
                      type="number"
                      min="0"
                      step="0.01"
                      value={electricity}
                      onChange={(e) => setElectricity(e.target.value)}
                      placeholder="e.g. 1800"
                      className={`w-full rounded-xl border bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                        calculation.errors.electricity
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-purple-900/40 focus:border-purple-500'
                      }`}
                    />
                  </div>
                  {calculation.errors.electricity && (
                    <p className="text-[11px] text-red-400 mt-1">{calculation.errors.electricity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="exp-wifi">
                    Wi-Fi / Internet (₹)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Wifi className="h-4 w-4 text-blue-400" />
                    </div>
                    <input
                      id="exp-wifi"
                      type="number"
                      min="0"
                      step="0.01"
                      value={wifi}
                      onChange={(e) => setWifi(e.target.value)}
                      placeholder="e.g. 999"
                      className={`w-full rounded-xl border bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                        calculation.errors.wifi
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-purple-900/40 focus:border-purple-500'
                      }`}
                    />
                  </div>
                  {calculation.errors.wifi && (
                    <p className="text-[11px] text-red-400 mt-1">{calculation.errors.wifi}</p>
                  )}
                </div>
              </div>

              {/* 4. Groceries & Miscellaneous Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="exp-groceries">
                    Shared Groceries (₹)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <ShoppingBag className="h-4 w-4 text-emerald-400" />
                    </div>
                    <input
                      id="exp-groceries"
                      type="number"
                      min="0"
                      step="0.01"
                      value={groceries}
                      onChange={(e) => setGroceries(e.target.value)}
                      placeholder="e.g. 6500"
                      className={`w-full rounded-xl border bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                        calculation.errors.groceries
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-purple-900/40 focus:border-purple-500'
                      }`}
                    />
                  </div>
                  {calculation.errors.groceries && (
                    <p className="text-[11px] text-red-400 mt-1">{calculation.errors.groceries}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="exp-misc">
                    Miscellaneous / Maid / Water (₹)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MoreHorizontal className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="exp-misc"
                      type="number"
                      min="0"
                      step="0.01"
                      value={misc}
                      onChange={(e) => setMisc(e.target.value)}
                      placeholder="e.g. 1500"
                      className={`w-full rounded-xl border bg-navy-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                        calculation.errors.misc
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-purple-900/40 focus:border-purple-500'
                      }`}
                    />
                  </div>
                  {calculation.errors.misc && (
                    <p className="text-[11px] text-red-400 mt-1">{calculation.errors.misc}</p>
                  )}
                </div>
              </div>

              {/* 5. Named Calculation Title */}
              <div className="pt-2 border-t border-purple-900/30">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="exp-title">
                  Calculation Name <span className="text-purple-400">*</span>
                </label>
                <input
                  id="exp-title"
                  type="text"
                  maxLength={120}
                  value={calculationTitle}
                  onChange={(e) => {
                    setCalculationTitle(e.target.value);
                    if (titleError) setTitleError('');
                  }}
                  placeholder="e.g. November Flat Share (HSR Layout 3BHK)"
                  className={`w-full rounded-xl border bg-navy-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                    titleError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-purple-900/40 focus:border-purple-500'
                  }`}
                />
                {titleError && (
                  <p className="text-[11px] text-red-400 mt-1">{titleError}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                {user ? (
                  <button
                    type="submit"
                    disabled={isSaving || !calculation.isValid}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition-all duration-200 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving to Account...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Calculation</span>
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-purple-700/50 bg-navy-950 px-6 py-3 text-sm font-medium text-purple-300 hover:text-white hover:border-purple-500 transition-all"
                  >
                    <span>Sign in to Save Calculations</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setRent('');
                    setElectricity('');
                    setWifi('');
                    setGroceries('');
                    setMisc('');
                    setFlatmates('3');
                    setCalculationTitle('');
                    setTitleError('');
                    setSaveError('');
                    setSaveSuccess('');
                  }}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-700/50 bg-navy-950 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Reset Calculator
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Live Calculation Summary & Saved Calculations */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Summary Card */}
            <div className="rounded-3xl border border-purple-900/50 bg-navy-900/90 p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                  Equal Split Result
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                  {calculation.flatmates} {calculation.flatmates === 1 ? 'Flatmate' : 'Flatmates'}
                </span>
              </div>

              {/* Big Per Person Split Callout */}
              <div className="rounded-2xl border border-purple-800/40 bg-navy-950/90 p-5 text-center shadow-inner">
                <span className="text-xs text-slate-400 block mb-1">Equal Cost Per Person</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300 tracking-tight break-all">
                  {formatINR(calculation.perPerson)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1.5">
                  Total Monthly Cost: <strong className="text-white">{formatINR(calculation.total)}</strong>
                </span>
                {calculation.remainderPaise > 0 && (
                  <span className="inline-block mt-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">
                    Rounding note: {formatINR(calculation.remainderPaise / 100)} indivisible remainder across {calculation.flatmates} shares
                  </span>
                )}
              </div>

              {/* Category-by-Category Cost Table */}
              <div className="space-y-2 text-xs">
                <span className="text-slate-400 font-medium block mb-2">Category Breakdown:</span>

                <div className="flex justify-between py-1 border-b border-purple-950 text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-purple-400" />
                    Rent:
                  </span>
                  <span className="font-semibold text-white">{formatINR(calculation.breakdown.rent)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-purple-950 text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    Electricity:
                  </span>
                  <span className="font-semibold text-white">{formatINR(calculation.breakdown.electricity)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-purple-950 text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5 text-blue-400" />
                    Wi-Fi:
                  </span>
                  <span className="font-semibold text-white">{formatINR(calculation.breakdown.wifi)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-purple-950 text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
                    Groceries:
                  </span>
                  <span className="font-semibold text-white">{formatINR(calculation.breakdown.groceries)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-purple-950 text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
                    Miscellaneous:
                  </span>
                  <span className="font-semibold text-white">{formatINR(calculation.breakdown.misc)}</span>
                </div>
              </div>
            </div>

            {/* Saved Calculations Section */}
            <div className="rounded-3xl border border-purple-900/40 bg-navy-900/80 p-6 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-purple-400" />
                  <span>Saved Calculations</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{savedExpenses.length} saved</span>
                  {user && (
                    <button
                      type="button"
                      onClick={fetchSavedExpenses}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Refresh saved calculations"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {authLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                </div>
              ) : !user ? (
                <div className="rounded-2xl border border-dashed border-purple-900/40 p-6 text-center text-xs text-slate-400">
                  <p className="mb-3">Sign in with your account to view and manage your saved flat calculations.</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-purple-300 font-semibold underline hover:text-white"
                  >
                    <span>Sign in now</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : loadingSaved ? (
                <div className="space-y-3 py-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-xl border border-purple-900/30 bg-navy-950/60 animate-pulse"
                    />
                  ))}
                </div>
              ) : fetchError ? (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold">
                      {schemaMissing ? <Database className="h-4 w-4 text-amber-400" /> : <AlertCircle className="h-4 w-4 text-red-400" />}
                      <span>{schemaMissing ? 'Table `public.expenses` not found in Supabase' : 'Unable to load saved calculations'}</span>
                    </span>
                    <button onClick={fetchSavedExpenses} className="underline text-red-200 flex-shrink-0">
                      Retry
                    </button>
                  </div>
                  <p className="text-[11px] text-red-300/80">{fetchError}</p>
                </div>
              ) : savedExpenses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-purple-900/40 p-6 text-center text-xs text-slate-400">
                  <Calculator className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-medium text-slate-300 mb-1">No calculations saved yet</p>
                  <p className="text-[11px] text-slate-500">
                    Enter your flat expenses on the left, give your calculation a name, and click &ldquo;Save Calculation&rdquo;.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {savedExpenses.map((exp) => {
                    const participants = Math.max(1, exp.participant_count || 1);
                    const perPersonAmt = calculatePerPersonFromTotal(exp.amount, participants);

                    return (
                      <div
                        key={exp.id}
                        className="rounded-xl border border-purple-900/30 bg-navy-950/70 p-4 transition-all hover:border-purple-700/60 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-white truncate">{exp.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span>{participants} {participants === 1 ? 'flatmate' : 'flatmates'}</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">
                              {formatINR(perPersonAmt)} / person
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {new Date(exp.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-bold text-white">
                            {formatINR(exp.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCalculation(exp.id)}
                            disabled={deletingId === exp.id}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title="Delete calculation"
                            aria-label={`Delete ${exp.title}`}
                          >
                            {deletingId === exp.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
