import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExpenseSplit,
  calculatePerPersonFromTotal,
  formatINR,
  toPaise,
} from '../lib/expenseCalculator.js';

describe('FlatMate AI Expense Splitting Calculator', () => {

  describe('1. Basic Calculation and Splitting', () => {
    it('should correctly sum all expense categories and divide equally', () => {
      const result = calculateExpenseSplit({
        rent: 20000,
        electricity: 1500,
        wifi: 800,
        groceries: 6000,
        misc: 1200,
        flatmates: 3,
      });

      assert.equal(result.isValid, true);
      assert.equal(result.total, 29500);
      // 29500 / 3 = 9833.3333... -> rounded to 9833.33
      assert.equal(result.perPerson, 9833.33);
      assert.equal(result.flatmates, 3);
      assert.equal(result.remainderPaise, 1);
    });

    it('should handle single flatmate calculation (100% share)', () => {
      const result = calculateExpenseSplit({
        rent: 12000,
        electricity: 800,
        wifi: 500,
        groceries: 3000,
        misc: 0,
        flatmates: 1,
      });

      assert.equal(result.isValid, true);
      assert.equal(result.total, 16300);
      assert.equal(result.perPerson, 16300);
      assert.equal(result.remainderPaise, 0);
    });
  });

  describe('2. Currency Rounding & Precision in Indian Rupees', () => {
    it('should eliminate IEEE-754 floating-point drift using integer paise arithmetic', () => {
      const result = calculateExpenseSplit({
        rent: 0.1,
        electricity: 0.2,
        wifi: 1.005,
        groceries: 0,
        misc: 0,
        flatmates: 1,
      });

      // 0.10 + 0.20 + 1.01 = 1.31
      assert.equal(toPaise(1.005), 101);
      assert.equal(result.total, 1.31);
      assert.equal(result.perPerson, 1.31);
    });

    it('should handle decimal bills and round evenly to two decimal places (paise)', () => {
      const result = calculateExpenseSplit({
        rent: 10000.50,
        electricity: 1234.75,
        wifi: 999.99,
        groceries: 4500.25,
        misc: 100.10,
        flatmates: 2,
      });

      assert.equal(result.isValid, true);
      assert.equal(result.total, 16835.59);
      // 1683559 / 2 = 841779.5 -> 841780 paise -> 8417.80
      assert.equal(result.perPerson, 8417.80);
      assert.equal(result.remainderPaise, 1);
    });

    it('should calculate per-person split accurately for saved database totals', () => {
      assert.equal(calculatePerPersonFromTotal(100, 3), 33.33);
      assert.equal(calculatePerPersonFromTotal(200, 3), 66.67);
      assert.equal(calculatePerPersonFromTotal(30000, 4), 7500);
    });

    it('should correctly format currency in Indian numbering system (lakhs/thousands)', () => {
      const formatted = formatINR(125450.75);
      assert.ok(formatted.includes('₹') || formatted.includes('INR'));
      assert.ok(formatted.includes('1,25,450.75'));
    });
  });

  describe('3. Validation of Nonnegative Amounts and Positive Participant Counts', () => {
    it('should reject negative amounts with informative errors', () => {
      const result = calculateExpenseSplit({
        rent: -5000,
        electricity: 1000,
        wifi: 500,
        groceries: 2000,
        misc: 0,
        flatmates: 2,
      });

      assert.equal(result.isValid, false);
      assert.ok(result.errors.rent);
    });

    it('should reject Infinity and NaN inputs', () => {
      const infResult = calculateExpenseSplit({
        rent: Infinity,
        wifi: 'abc',
        flatmates: 2,
      });

      assert.equal(infResult.isValid, false);
      assert.ok(infResult.errors.rent);
      assert.ok(infResult.errors.wifi);
    });

    it('should reject zero, empty, or negative flatmate counts', () => {
      const zeroFlatmates = calculateExpenseSplit({ rent: 15000, flatmates: 0 });
      assert.equal(zeroFlatmates.isValid, false);
      assert.ok(zeroFlatmates.errors.flatmates);

      const emptyFlatmates = calculateExpenseSplit({ rent: 15000, flatmates: '' });
      assert.equal(emptyFlatmates.isValid, false);
      assert.ok(emptyFlatmates.errors.flatmates);

      const negativeFlatmates = calculateExpenseSplit({ rent: 15000, flatmates: -2 });
      assert.equal(negativeFlatmates.isValid, false);
      assert.ok(negativeFlatmates.errors.flatmates);
    });

    it('should reject non-integer flatmate counts', () => {
      const floatFlatmates = calculateExpenseSplit({
        rent: 15000,
        flatmates: 2.5,
      });
      assert.equal(floatFlatmates.isValid, false);
      assert.ok(floatFlatmates.errors.flatmates);
    });
  });

  describe('4. Defaults and Empty Fields', () => {
    it('should treat empty or omitted expense inputs as 0 with 1 flatmate', () => {
      const result = calculateExpenseSplit({});
      assert.equal(result.isValid, true);
      assert.equal(result.total, 0);
      assert.equal(result.perPerson, 0);
      assert.equal(result.flatmates, 1);
    });
  });
});
