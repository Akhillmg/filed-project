import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBudgetScore,
  calculateLifestyleScore,
  calculateCleanlinessScore,
  calculateFoodScore,
  calculateSleepScore,
  calculateCompatibility,
  COMPATIBILITY_WEIGHTS,
} from '../lib/matching.js';

describe('FlatMate AI Deterministic Compatibility Algorithm', () => {

  // TEST SUITE 1: IDENTICAL PREFERENCES
  describe('1. Identical Preferences', () => {
    const profileA = {
      name: 'Alex',
      min_budget: 800,
      max_budget: 1200,
      lifestyle: 'College Student',
      cleanliness_level: 'Highly Organized & Clean',
      food_preference: 'Vegetarian',
      sleep_schedule: 'Early Bird (before 11 PM)',
    };

    const profileB = {
      name: 'Twin Alex',
      min_budget: 800,
      max_budget: 1200,
      lifestyle: 'College Student',
      cleanliness_level: 'Highly Organized & Clean',
      food_preference: 'Vegetarian',
      sleep_schedule: 'Early Bird (before 11 PM)',
    };

    it('should return 100 for identical budget ranges', () => {
      const budgetScore = calculateBudgetScore(profileA, profileB);
      assert.equal(budgetScore, 100);
    });

    it('should return 100 for identical lifestyle', () => {
      const score = calculateLifestyleScore(profileA, profileB);
      assert.equal(score, 100);
    });

    it('should return 100 for identical cleanliness', () => {
      const score = calculateCleanlinessScore(profileA, profileB);
      assert.equal(score, 100);
    });

    it('should return 100 for identical food preference', () => {
      const score = calculateFoodScore(profileA, profileB);
      assert.equal(score, 100);
    });

    it('should return 100 for identical sleep schedule', () => {
      const score = calculateSleepScore(profileA, profileB);
      assert.equal(score, 100);
    });

    it('should produce an overall score of exactly 100 and High Compatibility tier', () => {
      const result = calculateCompatibility(profileA, profileB);
      assert.equal(result.overallScore, 100);
      assert.equal(result.tier, 'High Compatibility');
      assert.ok(result.strengths.length > 0);
      assert.equal(result.friction.length, 0);
    });
  });

  // TEST SUITE 2: INCOMPATIBLE BUDGETS
  describe('2. Incompatible Budgets', () => {
    it('should return 0 when budget intervals are completely disjoint', () => {
      // User can only afford 400 - 600, candidate wants 1200 - 1800
      const lowBudget = { min_budget: 400, max_budget: 600 };
      const highBudget = { min_budget: 1200, max_budget: 1800 };

      const score = calculateBudgetScore(lowBudget, highBudget);
      assert.equal(score, 0);
    });

    it('should significantly depress overall score when budgets do not overlap', () => {
      const user = {
        min_budget: 500,
        max_budget: 700,
        lifestyle: 'College Student',
        cleanliness_level: 'Balanced / Normal',
        food_preference: 'No Preference',
        sleep_schedule: 'Flexible',
      };

      const wealthyCandidate = {
        min_budget: 1800,
        max_budget: 2500,
        lifestyle: 'College Student',
        cleanliness_level: 'Balanced / Normal',
        food_preference: 'No Preference',
        sleep_schedule: 'Flexible',
      };

      const result = calculateCompatibility(user, wealthyCandidate);
      assert.equal(result.breakdown.budgetScore, 0);
      // Because budget is 30% weight, max possible score is 70
      assert.ok(result.overallScore <= 70);
      assert.ok(result.friction.some((f) => f.includes('budget')));
    });

    it('should handle zero-width point budgets correctly', () => {
      // User has exact budget $1000, Candidate has range 800 - 1200
      const pointBudget = { min_budget: 1000, max_budget: 1000 };
      const rangeBudget = { min_budget: 800, max_budget: 1200 };

      const score = calculateBudgetScore(pointBudget, rangeBudget);
      assert.equal(score, 100); // Point is inside range

      // Point budget outside range: $500 vs 1000 - 1500
      const outsidePoint = { min_budget: 500, max_budget: 500 };
      const outsideScore = calculateBudgetScore(outsidePoint, rangeBudget);
      assert.ok(outsideScore < 50);
    });
  });

  // TEST SUITE 3: MISSING VALUES (NEVER TREAT AS 100)
  describe('3. Missing Values Handling', () => {
    it('should NOT treat missing budget as a perfect match (returns 40)', () => {
      const profileWithBudget = { min_budget: 800, max_budget: 1200 };
      const profileMissingBudget = { min_budget: null, max_budget: null };

      const score = calculateBudgetScore(profileWithBudget, profileMissingBudget);
      assert.equal(score, 40);
      assert.notEqual(score, 100);
    });

    it('should NOT treat missing categorical preferences as 100', () => {
      const completeProfile = {
        lifestyle: 'College Student',
        cleanliness_level: 'Balanced / Normal',
        food_preference: 'Vegetarian',
        sleep_schedule: 'Early Bird',
      };

      const emptyProfile = {
        lifestyle: null,
        cleanliness_level: undefined,
        food_preference: '',
        sleep_schedule: null,
      };

      assert.equal(calculateLifestyleScore(completeProfile, emptyProfile), 50);
      assert.equal(calculateCleanlinessScore(completeProfile, emptyProfile), 50);
      assert.equal(calculateFoodScore(completeProfile, emptyProfile), 50);
      assert.equal(calculateSleepScore(completeProfile, emptyProfile), 50);
    });

    it('should score an entirely blank profile well below a matching profile', () => {
      const user = {
        min_budget: 900,
        max_budget: 1300,
        lifestyle: 'College Student',
        cleanliness_level: 'Highly Organized & Clean',
        food_preference: 'Vegan',
        sleep_schedule: 'Early Bird',
      };

      const blankCandidate = {};

      const result = calculateCompatibility(user, blankCandidate);
      assert.ok(result.overallScore <= 50);
      assert.ok(result.friction.length > 0);
    });
  });

  // TEST SUITE 4: SCORE BOUNDARIES & WEIGHT VERIFICATION
  describe('4. Score Boundaries & Weight Sum', () => {
    it('should have weights summing exactly to 1.00 (100%)', () => {
      const sum =
        COMPATIBILITY_WEIGHTS.budget +
        COMPATIBILITY_WEIGHTS.lifestyle +
        COMPATIBILITY_WEIGHTS.cleanliness +
        COMPATIBILITY_WEIGHTS.food +
        COMPATIBILITY_WEIGHTS.sleep;

      assert.ok(Math.abs(sum - 1.0) < 0.0001);
      assert.equal(COMPATIBILITY_WEIGHTS.budget, 0.30);
      assert.equal(COMPATIBILITY_WEIGHTS.lifestyle, 0.25);
      assert.equal(COMPATIBILITY_WEIGHTS.cleanliness, 0.20);
      assert.equal(COMPATIBILITY_WEIGHTS.food, 0.15);
      assert.equal(COMPATIBILITY_WEIGHTS.sleep, 0.10);
    });

    it('should strictly bound scores between 0 and 100 with extreme/inverted inputs', () => {
      // Inverted budget: min > max, negative numbers
      const extremeProfileA = {
        min_budget: -500,
        max_budget: -100,
        cleanliness_level: 'unknown_value',
        lifestyle: '???',
      };

      const extremeProfileB = {
        min_budget: 999999,
        max_budget: 1000000,
        cleanliness_level: null,
      };

      const result = calculateCompatibility(extremeProfileA, extremeProfileB);
      assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
      assert.ok(result.breakdown.budgetScore >= 0 && result.breakdown.budgetScore <= 100);
      assert.ok(result.breakdown.cleanlinessScore >= 0 && result.breakdown.cleanlinessScore <= 100);
    });
  });

  // TEST SUITE 5: CATEGORICAL DIVERGENCES (FRICTION RULES)
  describe('5. Specific Friction & Divergence Rules', () => {
    it('should assign a low score (20) to opposing sleep cycles (Early Bird vs Night Owl)', () => {
      const early = { sleep_schedule: 'Early Bird (before 11 PM)' };
      const night = { sleep_schedule: 'Night Owl (after 1 AM)' };
      assert.equal(calculateSleepScore(early, night), 20);
    });

    it('should assign a low score (20) to opposing cleanliness standards (Organized vs Relaxed)', () => {
      const neat = { cleanliness_level: 'Highly Organized & Clean' };
      const relaxed = { cleanliness_level: 'Relaxed / Laid-back' };
      assert.equal(calculateCleanlinessScore(neat, relaxed), 20);
    });

    it('should penalize Vegan vs Non-Vegetarian (30) while rewarding accommodating No Preference (90)', () => {
      const vegan = { food_preference: 'Vegan' };
      const nonVeg = { food_preference: 'Non-Vegetarian' };
      const noPref = { food_preference: 'No Preference' };

      assert.equal(calculateFoodScore(vegan, nonVeg), 30);
      assert.equal(calculateFoodScore(nonVeg, noPref), 90);
    });
  });
});

