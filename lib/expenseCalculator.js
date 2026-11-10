/**
 * @file lib/expenseCalculator.js
 * @description Pure calculation utilities for rent and shared expense splitting in Indian Rupees (INR).
 * Uses integer paise arithmetic to guarantee exact decimal currency precision and rounding.
 */

/**
 * Safely converts a numeric rupee input to integer paise (1 INR = 100 paise).
 * Avoids IEEE-754 floating-point drift (e.g. 1.005 * 100 = 100.49999999999999).
 */
export function toPaise(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.round(Number((num * 100).toFixed(4)));
}

/**
 * Validates and calculates monthly rent and expense splits across flatmates in INR.
 *
 * @param {Object} params
 * @param {number|string} params.rent - Monthly flat/room rent (>= 0)
 * @param {number|string} params.electricity - Electricity bill (>= 0)
 * @param {number|string} params.wifi - Internet / Wi-Fi bill (>= 0)
 * @param {number|string} params.groceries - Shared groceries & kitchen supplies (>= 0)
 * @param {number|string} params.misc - Miscellaneous flat expenses (>= 0)
 * @param {number|string} params.flatmates - Number of flatmates sharing the cost (integer >= 1)
 * @returns {Object} Validation status, itemized breakdown, totals, and rounding metadata
 */
export function calculateExpenseSplit({
  rent = 0,
  electricity = 0,
  wifi = 0,
  groceries = 0,
  misc = 0,
  flatmates = 1,
}) {
  const errors = {};

  const validateAmount = (raw, key, label) => {
    if (raw === '' || raw === null || raw === undefined) return;
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) {
      errors[key] = `${label} must be a valid non-negative amount.`;
    }
  };

  validateAmount(rent, 'rent', 'Rent');
  validateAmount(electricity, 'electricity', 'Electricity bill');
  validateAmount(wifi, 'wifi', 'Wi-Fi bill');
  validateAmount(groceries, 'groceries', 'Groceries');
  validateAmount(misc, 'misc', 'Miscellaneous expenses');

  const numFlatmates = Number(flatmates);
  if (
    flatmates === '' ||
    flatmates === null ||
    flatmates === undefined ||
    !Number.isFinite(numFlatmates) ||
    numFlatmates < 1 ||
    !Number.isInteger(numFlatmates)
  ) {
    errors.flatmates = 'Number of flatmates must be a positive whole number (at least 1).';
  }

  const isValid = Object.keys(errors).length === 0;

  // Convert sanitized inputs to integer paise for exact arithmetic
  const rentPaise = errors.rent ? 0 : toPaise(rent);
  const electricityPaise = errors.electricity ? 0 : toPaise(electricity);
  const wifiPaise = errors.wifi ? 0 : toPaise(wifi);
  const groceriesPaise = errors.groceries ? 0 : toPaise(groceries);
  const miscPaise = errors.misc ? 0 : toPaise(misc);

  const safeCount =
    !errors.flatmates && Number.isInteger(numFlatmates) && numFlatmates >= 1
      ? numFlatmates
      : 1;

  const totalPaise = rentPaise + electricityPaise + wifiPaise + groceriesPaise + miscPaise;
  const total = totalPaise / 100;

  // Equal per-person share rounded to nearest paise
  const perPersonPaise = Math.round(totalPaise / safeCount);
  const perPerson = perPersonPaise / 100;

  // Remainder paise when totalPaise is not cleanly divisible by safeCount
  const floorSharePaise = Math.floor(totalPaise / safeCount);
  const remainderPaise = totalPaise - floorSharePaise * safeCount;

  return {
    isValid,
    errors,
    breakdown: {
      rent: rentPaise / 100,
      electricity: electricityPaise / 100,
      wifi: wifiPaise / 100,
      groceries: groceriesPaise / 100,
      misc: miscPaise / 100,
    },
    flatmates: safeCount,
    total,
    perPerson,
    remainderPaise,
  };
}

/**
 * Computes equal per-person cost rounded cleanly to 2 decimal places (paise).
 */
export function calculatePerPersonFromTotal(totalAmount, participantCount) {
  const totalPaise = toPaise(totalAmount);
  const count = Math.max(1, Math.floor(Number(participantCount) || 1));
  return Math.round(totalPaise / count) / 100;
}

/**
 * Formats a monetary amount into standard Indian Rupees (INR) format (e.g. ₹12,500.00).
 *
 * @param {number} amount
 * @returns {string} Formatted Indian Rupee string
 */
export function formatINR(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return '₹0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
