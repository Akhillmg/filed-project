/**
 * @file lib/matching.js
 * @description Explainable, deterministic, rule-based flatmate compatibility recommendation algorithm.
 * 
 * NOTE: This is a deterministic, rule-based multi-criteria decision model, NOT a trained Machine Learning model.
 * It produces consistent, mathematically verifiable, and explainable compatibility scores.
 * 
 * WEIGHT DISTRIBUTION:
 * - Budget Overlap:          30% (0.30)
 * - Lifestyle Compatibility:  25% (0.25)
 * - Cleanliness Standards:    20% (0.20)
 * - Food Preferences:         15% (0.15)
 * - Sleep Routine:            10% (0.10)
 * Total:                     100% (1.00)
 */

export const COMPATIBILITY_WEIGHTS = {
  budget: 0.30,
  lifestyle: 0.25,
  cleanliness: 0.20,
  food: 0.15,
  sleep: 0.10,
};

// Ordinal Cleanliness Levels mapping
const CLEANLINESS_LEVELS = {
  'highly organized & clean': 3,
  'high': 3,
  'balanced / normal': 2,
  'moderate': 2,
  'relaxed / laid-back': 1,
  'relaxed': 1,
};

/**
 * Normalizes categorical string inputs (trims, lowercases).
 */
function normalizeCategory(val) {
  if (typeof val !== 'string') return '';
  return val.trim().toLowerCase();
}

/**
 * Clamps a numerical value between min and max.
 */
function clamp(val, min = 0, max = 100) {
  if (isNaN(val)) return min;
  return Math.min(Math.max(val, min), max);
}

/**
 * Parses and sanitizes a budget interval [min, max].
 * Guarantees nonnegative values and valid bounds.
 */
function sanitizeBudget(min, max) {
  const pMin = min !== null && min !== undefined && min !== '' ? Number(min) : null;
  const pMax = max !== null && max !== undefined && max !== '' ? Number(max) : null;

  const validMin = pMin !== null && !isNaN(pMin) ? Math.max(0, pMin) : null;
  const validMax = pMax !== null && !isNaN(pMax) ? Math.max(0, pMax) : null;

  if (validMin === null && validMax === null) {
    return null; // Missing budget data
  }

  const lower = validMin ?? validMax;
  const upper = validMax ?? validMin;

  return {
    min: Math.min(lower, upper),
    max: Math.max(lower, upper),
    isZeroWidth: Math.min(lower, upper) === Math.max(lower, upper),
  };
}

/**
 * 1. BUDGET OVERLAP SCORE (Weight: 30%)
 * 
 * Rules:
 * - Missing data: If either profile lacks budget data, return 40 (never treat missing as perfect match).
 * - Zero-width ranges:
 *   - Both point budgets equal: 100
 *   - Point budget falls within target interval: 100
 *   - Point budget outside interval: Distance decay based on relative gap.
 * - Non-zero width intervals [U1, U2] and [C1, C2]:
 *   - Overlap = max(0, min(U2, C2) - max(U1, C1))
 *   - Union = max(U2, C2) - min(U1, C1)
 *   - If overlap > 0:
 *     score = 0.5 * (overlap / min_interval_width) + 0.5 * (overlap / union) * 100
 *   - If overlap <= 0 (disjoint / incompatible):
 *     score = 0 (penalized for financial incompatibility).
 */
export function calculateBudgetScore(userProfile, candidateProfile) {
  const bUser = sanitizeBudget(userProfile?.min_budget, userProfile?.max_budget);
  const bCandidate = sanitizeBudget(candidateProfile?.min_budget, candidateProfile?.max_budget);

  // Missing data rule
  if (!bUser || !bCandidate) {
    return 40;
  }

  // Zero-width handling
  if (bUser.isZeroWidth && bCandidate.isZeroWidth) {
    if (bUser.min === bCandidate.min) return 100;
    const gap = Math.abs(bUser.min - bCandidate.min);
    const base = Math.max(bUser.min, bCandidate.min, 1);
    return clamp(Math.round(100 - (gap / base) * 150));
  }

  if (bUser.isZeroWidth) {
    if (bUser.min >= bCandidate.min && bUser.min <= bCandidate.max) return 100;
    const gap = bUser.min < bCandidate.min ? bCandidate.min - bUser.min : bUser.min - bCandidate.max;
    const base = Math.max(bCandidate.min, 1);
    return clamp(Math.round(Math.max(0, 100 - (gap / base) * 150)));
  }

  if (bCandidate.isZeroWidth) {
    if (bCandidate.min >= bUser.min && bCandidate.min <= bUser.max) return 100;
    const gap = bCandidate.min < bUser.min ? bUser.min - bCandidate.min : bCandidate.min - bUser.max;
    const base = Math.max(bUser.min, 1);
    return clamp(Math.round(Math.max(0, 100 - (gap / base) * 150)));
  }

  // Both are non-zero intervals
  const overlapMin = Math.max(bUser.min, bCandidate.min);
  const overlapMax = Math.min(bUser.max, bCandidate.max);
  const overlap = overlapMax - overlapMin;

  if (overlap <= 0) {
    // Incompatible budgets: disjoint intervals
    return 0;
  }

  const union = Math.max(bUser.max, bCandidate.max) - Math.min(bUser.min, bCandidate.min);
  const minWidth = Math.min(bUser.max - bUser.min, bCandidate.max - bCandidate.min);

  const overlapRatio = minWidth > 0 ? overlap / minWidth : 1;
  const jaccard = union > 0 ? overlap / union : 1;

  const score = (0.5 * overlapRatio + 0.5 * jaccard) * 100;
  return clamp(Math.round(score));
}

/**
 * 2. LIFESTYLE COMPATIBILITY SCORE (Weight: 25%)
 * 
 * Rules:
 * - Missing data: 50 (neutral penalty).
 * - Exact match: 100.
 * - College Student + Hybrid: 75.
 * - Working Professional + Hybrid: 85.
 * - Working Professional + Remote: 75.
 * - Remote + Hybrid: 85.
 * - College Student + Working Professional: 50 (divergent schedules and focus).
 * - College Student + Remote: 55.
 */
export function calculateLifestyleScore(userProfile, candidateProfile) {
  const u = normalizeCategory(userProfile?.lifestyle);
  const c = normalizeCategory(candidateProfile?.lifestyle);

  if (!u || !c) return 50;
  if (u === c) return 100;

  const s = new Set([u, c]);

  const has = (keyword) => {
    for (const val of s) {
      if (val.includes(keyword)) return true;
    }
    return false;
  };

  if (has('college') && has('hybrid')) return 75;
  if (has('working') && has('hybrid')) return 85;
  if (has('remote') && has('hybrid')) return 85;
  if (has('remote') && has('working')) return 75;
  if (has('college') && has('remote')) return 55;
  if (has('college') && has('working')) return 50;

  return 60; // default compatible baseline
}

/**
 * 3. CLEANLINESS COMPATIBILITY SCORE (Weight: 20%)
 * 
 * Cleanliness is mapped to an ordinal scale: Level 1 (Relaxed), Level 2 (Balanced), Level 3 (Highly Organized).
 * Rules:
 * - Missing data: 50.
 * - Delta = 0: 100.
 * - Delta = 1 (e.g. Organized vs Balanced, or Balanced vs Relaxed): 70 (moderate compromise).
 * - Delta = 2 (Organized vs Relaxed): 20 (high friction clash between neat freaks and relaxed flatmates).
 */
export function calculateCleanlinessScore(userProfile, candidateProfile) {
  const uStr = normalizeCategory(userProfile?.cleanliness_level);
  const cStr = normalizeCategory(candidateProfile?.cleanliness_level);

  if (!uStr || !cStr) return 50;

  const uLvl = CLEANLINESS_LEVELS[uStr] ?? 2;
  const cLvl = CLEANLINESS_LEVELS[cStr] ?? 2;

  const diff = Math.abs(uLvl - cLvl);

  if (diff === 0) return 100;
  if (diff === 1) return 70;
  return 20; // diff === 2
}

/**
 * 4. FOOD PREFERENCE SCORE (Weight: 15%)
 * 
 * Rules:
 * - Missing data: 50.
 * - Either has "No Preference": 90 (accommodating).
 * - Exact match: 100.
 * - Vegetarian + Vegan: 85.
 * - Vegetarian + Eggetarian: 80.
 * - Vegan + Eggetarian: 75.
 * - Eggetarian + Non-Vegetarian: 65.
 * - Vegetarian + Non-Vegetarian: 40 (kitchen/utensil friction).
 * - Vegan + Non-Vegetarian: 30 (deep dietary friction).
 */
export function calculateFoodScore(userProfile, candidateProfile) {
  const u = normalizeCategory(userProfile?.food_preference);
  const c = normalizeCategory(candidateProfile?.food_preference);

  if (!u || !c) return 50;
  if (u === 'no preference' || c === 'no preference') return 90;
  if (u === c) return 100;

  const s = new Set([u, c]);

  if (s.has('vegan') && s.has('non-vegetarian')) return 30;
  if (s.has('vegetarian') && s.has('non-vegetarian')) return 40;
  if (s.has('eggetarian') && s.has('non-vegetarian')) return 65;
  if (s.has('vegan') && s.has('vegetarian')) return 85;
  if (s.has('eggetarian') && s.has('vegetarian')) return 80;
  if (s.has('eggetarian') && s.has('vegan')) return 75;

  return 60;
}

/**
 * 5. SLEEP SCHEDULE SCORE (Weight: 10%)
 * 
 * Rules:
 * - Missing data: 50.
 * - Exact match: 100.
 * - Either is "Flexible": 85.
 * - Early Bird vs Night Owl: 20 (severe friction regarding lights, late-night noise, and morning routines).
 */
export function calculateSleepScore(userProfile, candidateProfile) {
  const u = normalizeCategory(userProfile?.sleep_schedule);
  const c = normalizeCategory(candidateProfile?.sleep_schedule);

  if (!u || !c) return 50;
  if (u === c) return 100;

  const isUFlexible = u.includes('flexible');
  const isCFlexible = c.includes('flexible');
  if (isUFlexible || isCFlexible) return 85;

  const isUEarly = u.includes('early');
  const isCEarly = c.includes('early');
  const isUNight = u.includes('night');
  const isCNight = c.includes('night');

  if ((isUEarly && isCNight) || (isUNight && isCEarly)) {
    return 20; // Opposing sleep cycles
  }

  return 70;
}

/**
 * Generates human-readable explanations of the top matching strengths and potential friction points.
 */
function generateExplanations(breakdown, userProfile, candidateProfile) {
  const strengths = [];
  const friction = [];

  // 1. Budget analysis
  if (breakdown.budgetScore >= 80) {
    strengths.push('Compatible monthly budget range with healthy overlap.');
  } else if (breakdown.budgetScore <= 30) {
    friction.push('Monthly budget ranges have little to no overlap.');
  }

  // 2. Lifestyle analysis
  if (breakdown.lifestyleScore >= 80) {
    strengths.push(`Shared daily status (${candidateProfile?.lifestyle || 'aligned'}).`);
  } else if (breakdown.lifestyleScore <= 55) {
    friction.push(`Contrasting routines (${userProfile?.lifestyle || 'User'} vs ${candidateProfile?.lifestyle || 'Candidate'}).`);
  }

  // 3. Cleanliness analysis
  if (breakdown.cleanlinessScore >= 80) {
    strengths.push('Identical expectations for apartment tidiness.');
  } else if (breakdown.cleanlinessScore <= 30) {
    friction.push('Significant gap in cleanliness habits (organized vs laid-back).');
  }

  // 4. Food preference analysis
  if (breakdown.foodScore >= 85) {
    strengths.push('Harmonious dietary preferences for kitchen sharing.');
  } else if (breakdown.foodScore <= 45) {
    friction.push('Different dietary preferences (may require separate cookware/storage).');
  }

  // 5. Sleep routine analysis
  if (breakdown.sleepScore >= 80) {
    strengths.push('Matching sleep and wake hours.');
  } else if (breakdown.sleepScore <= 30) {
    friction.push('Opposing circadian rhythms (Early Bird vs Night Owl).');
  }

  return { strengths, friction };
}

/**
 * MAIN RECOMMENDATION ENGINE FUNCTION
 * Computes deterministic flatmate compatibility between a user and candidate.
 * 
 * @param {Object} userProfile - Logged in user's profile
 * @param {Object} candidateProfile - Potential roommate's profile
 * @returns {Object} Deterministic compatibility analysis
 */
export function calculateCompatibility(userProfile, candidateProfile) {
  // If either profile is missing, return baseline neutral response
  if (!userProfile || !candidateProfile) {
    return {
      overallScore: 50,
      tier: 'Moderate Match',
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      breakdown: {
        budgetScore: 50,
        lifestyleScore: 50,
        cleanlinessScore: 50,
        foodScore: 50,
        sleepScore: 50,
      },
      strengths: ['Standard baseline compatibility.'],
      friction: ['Incomplete profile details provided.'],
    };
  }

  // Calculate component scores in [0, 100]
  const budgetScore = calculateBudgetScore(userProfile, candidateProfile);
  const lifestyleScore = calculateLifestyleScore(userProfile, candidateProfile);
  const cleanlinessScore = calculateCleanlinessScore(userProfile, candidateProfile);
  const foodScore = calculateFoodScore(userProfile, candidateProfile);
  const sleepScore = calculateSleepScore(userProfile, candidateProfile);

  // Compute weighted sum
  const weightedSum =
    budgetScore * COMPATIBILITY_WEIGHTS.budget +
    lifestyleScore * COMPATIBILITY_WEIGHTS.lifestyle +
    cleanlinessScore * COMPATIBILITY_WEIGHTS.cleanliness +
    foodScore * COMPATIBILITY_WEIGHTS.food +
    sleepScore * COMPATIBILITY_WEIGHTS.sleep;

  // Final score rounded and strictly clamped to [0, 100]
  const overallScore = clamp(Math.round(weightedSum), 0, 100);

  // Tier classification and visual badge styling
  let tier = 'Moderate Match';
  let colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';

  if (overallScore >= 85) {
    tier = 'High Compatibility';
    colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  } else if (overallScore >= 70) {
    tier = 'Good Match';
    colorClass = 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30';
  } else if (overallScore < 50) {
    tier = 'Low Compatibility';
    colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  }

  const breakdown = {
    budgetScore,
    lifestyleScore,
    cleanlinessScore,
    foodScore,
    sleepScore,
  };

  const { strengths, friction } = generateExplanations(breakdown, userProfile, candidateProfile);

  return {
    overallScore,
    tier,
    colorClass,
    breakdown,
    strengths,
    friction,
  };
}
