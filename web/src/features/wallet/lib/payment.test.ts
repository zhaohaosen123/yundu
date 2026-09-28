import { describe, expect, test } from 'vitest'

import { PAYMENT_TYPES } from '../constants'
import {
  calculatePresetPricing,
  formatPlatformCredit,
  formatRmbPayment,
  getBonusLabel,
} from './format'
import {
  dispatchSelectedPayment,
  isStripePayment,
  isWaffoPayment,
  isWaffoPancakePayment,
  mergePresetAmounts,
} from './payment'

describe('payment type classification', () => {
  test('keeps Waffo and Waffo Pancake on their dedicated flows', () => {
    expect(isWaffoPayment(PAYMENT_TYPES.WAFFO)).toBe(true)
    expect(isWaffoPayment(PAYMENT_TYPES.WAFFO_PANCAKE)).toBe(false)
    expect(isWaffoPancakePayment(PAYMENT_TYPES.WAFFO_PANCAKE)).toBe(true)
    expect(isWaffoPancakePayment(PAYMENT_TYPES.WAFFO)).toBe(false)
    expect(isStripePayment(PAYMENT_TYPES.STRIPE)).toBe(true)
  })
})

describe('payment dispatch', () => {
  test('keeps the selected Waffo method index through confirmation', async () => {
    const calls: string[] = []
    const success = await dispatchSelectedPayment(
      { name: 'Waffo Card', type: PAYMENT_TYPES.WAFFO },
      120,
      3,
      {
        regular: async () => {
          calls.push('regular')
          return false
        },
        waffo: async (amount, index) => {
          calls.push(`waffo:${amount}:${index}`)
          return true
        },
        waffoPancake: async () => {
          calls.push('pancake')
          return false
        },
      }
    )

    expect(success).toBe(true)
    expect(calls).toEqual(['waffo:120:3'])
  })

  test('does not create a Waffo order without a selected method index', async () => {
    let called = false
    const success = await dispatchSelectedPayment(
      { name: 'Waffo Card', type: PAYMENT_TYPES.WAFFO },
      120,
      null,
      {
        regular: async () => false,
        waffo: async () => {
          called = true
          return true
        },
        waffoPancake: async () => false,
      }
    )

    expect(success).toBe(false)
    expect(called).toBe(false)
  })
})

describe('preset pricing presentation', () => {
  test('keeps only configured bonus packages and removes legacy 10 and 20 RMB options', () => {
    expect(
      mergePresetAmounts([10, 20, 50, 100, 200, 500], {
        50: 55,
        100: 120,
        200: 250,
        500: 700,
      })
    ).toEqual([
      { value: 50, creditedAmount: 55 },
      { value: 100, creditedAmount: 120 },
      { value: 200, creditedAmount: 250 },
      { value: 500, creditedAmount: 700 },
    ])
  })

  test.each([
    { payment: 50, credit: 55, bonus: 5, label: '+10%' },
    { payment: 100, credit: 120, bonus: 20, label: '+20%' },
    { payment: 200, credit: 250, bonus: 50, label: '+25%' },
    { payment: 500, credit: 700, bonus: 200, label: '+40%' },
  ])(
    'shows ¥$payment payment as $credit USD platform credit',
    ({ payment, credit, bonus, label }) => {
      const pricing = calculatePresetPricing(payment, credit, 1)

      expect(pricing).toEqual({
        platformCredit: credit,
        paymentAmount: payment,
        bonusAmount: bonus,
        hasBonus: true,
      })
      expect(formatPlatformCredit(pricing.platformCredit)).toContain('$')
      expect(formatRmbPayment(pricing.paymentAmount)).toMatch(/[¥￥]/)
      expect(getBonusLabel(payment, credit)).toBe(label)
    }
  )

  test('keeps custom pricing at one-to-one without a bonus', () => {
    expect(calculatePresetPricing(100, 100, 1)).toEqual({
      platformCredit: 100,
      paymentAmount: 100,
      bonusAmount: 0,
      hasBonus: false,
    })
    expect(getBonusLabel(100, 100)).toBe('')
  })
})
