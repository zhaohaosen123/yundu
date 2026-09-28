import { formatLocalCurrencyAmount } from '@/lib/currency'

// ============================================================================
// Wallet-specific Formatting Functions
// ============================================================================

/**
 * Format Creem price with currency symbol (USD/EUR)
 */
export function formatCreemPrice(price: number, currency: string): string {
  void currency
  return formatLocalCurrencyAmount(price, {
    digitsLarge: 2,
    digitsSmall: 2,
    abbreviate: false,
  })
}

/**
 * Format large quota numbers with K/M suffix
 */
export function formatQuotaShort(quota: number): string {
  if (quota >= 1000000) {
    return `${(quota / 1000000).toFixed(1)}M`
  }
  if (quota >= 1000) {
    return `${(quota / 1000).toFixed(1)}K`
  }
  return quota.toString()
}

/**
 * Format currency amount that is already in local currency.
 * This is used for payment amounts that have been calculated via priceRatio.
 */
export function formatCurrency(amount: number | string): string {
  const numeric =
    typeof amount === 'number' ? amount : Number.parseFloat(String(amount))
  if (!Number.isFinite(numeric)) return '-'

  return formatLocalCurrencyAmount(numeric, {
    digitsLarge: 2,
    digitsSmall: 4,
    abbreviate: false,
  })
}

/**
 * Format platform credit in its canonical USD unit.
 */
export function formatPlatformCredit(amount: number | string): string {
  const numeric =
    typeof amount === 'number' ? amount : Number.parseFloat(String(amount))
  if (!Number.isFinite(numeric)) return '-'

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.abs(numeric) >= 1 ? 2 : 4,
  }).format(numeric)
}

/**
 * Format payment amounts in RMB regardless of the quota display preference.
 */
export function formatRmbPayment(amount: number | string): string {
  const numeric =
    typeof amount === 'number' ? amount : Number.parseFloat(String(amount))
  if (!Number.isFinite(numeric)) return '-'

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'CNY',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.abs(numeric) >= 1 ? 2 : 4,
  }).format(numeric)
}

/**
 * Get the bonus percentage relative to the RMB amount paid.
 */
export function getBonusLabel(
  paymentAmount: number,
  creditedAmount: number
): string {
  if (paymentAmount <= 0 || creditedAmount <= paymentAmount) return ''
  return `+${Math.round((creditedAmount / paymentAmount - 1) * 100)}%`
}

/**
 * Calculate pricing details for a preset amount
 */
export function calculatePresetPricing(
  paymentValue: number,
  creditedAmount: number,
  priceRatio: number
) {
  const platformCredit = creditedAmount
  const paymentAmount = paymentValue * priceRatio
  const bonusAmount = creditedAmount - paymentValue
  const hasBonus = bonusAmount > 0

  return {
    platformCredit,
    paymentAmount,
    bonusAmount,
    hasBonus,
  }
}
