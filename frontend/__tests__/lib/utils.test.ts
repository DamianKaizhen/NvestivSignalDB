import { cn, formatNumber, formatCurrency, formatDate } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      expect(cn('text-red-500', false && 'bg-blue-500', 'p-4')).toBe('text-red-500 p-4')
    })

    it('should merge tailwind classes correctly', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4')
    })

    it('should handle undefined and null values', () => {
      expect(cn('text-red-500', undefined, null, 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers correctly', () => {
      expect(formatNumber(123)).toBe('123')
      expect(formatNumber(1234)).toBe('1.2K')
      expect(formatNumber(1000)).toBe('1.0K')
      expect(formatNumber(1234567)).toBe('1.2M')
      expect(formatNumber(1000000)).toBe('1.0M')
    })

    it('should handle edge cases', () => {
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(null)).toBe('0')
      expect(formatNumber(undefined)).toBe('0')
      expect(formatNumber(NaN)).toBe('0')
    })

    it('should handle decimal numbers', () => {
      expect(formatNumber(1234.56)).toBe('1.2K')
      expect(formatNumber(999.99)).toBe('999.99')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000')
      expect(formatCurrency(1234567)).toBe('$1,234,567')
      expect(formatCurrency(0)).toBe('$0')
    })

    it('should handle edge cases', () => {
      expect(formatCurrency(null)).toBe('$0')
      expect(formatCurrency(undefined)).toBe('$0')
      expect(formatCurrency(NaN)).toBe('$0')
    })

    it('should not show decimal places', () => {
      expect(formatCurrency(1000.99)).toBe('$1,001')
      expect(formatCurrency(999.01)).toBe('$999')
    })

    it('should handle negative numbers', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000')
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2023-12-25')
      expect(formatDate(date)).toBe('Dec 25, 2023')
    })

    it('should format date strings correctly', () => {
      expect(formatDate('2023-12-25')).toBe('Dec 25, 2023')
      expect(formatDate('2023-01-01')).toBe('Jan 1, 2023')
    })

    it('should handle edge cases', () => {
      expect(formatDate(null)).toBe('Unknown')
      expect(formatDate(undefined)).toBe('Unknown')
      expect(formatDate('')).toBe('Unknown')
    })

    it('should handle invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date')
      expect(formatDate('not-a-date')).toBe('Invalid Date')
    })

    it('should handle different date formats', () => {
      expect(formatDate('2023/12/25')).toBe('Dec 25, 2023')
      expect(formatDate('12-25-2023')).toBe('Dec 25, 2023')
    })
  })
})