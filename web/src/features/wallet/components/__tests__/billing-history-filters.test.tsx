import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'

import { BillingHistoryFilters } from '../billing-history-filters'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

it('applies payment status and method independently', async () => {
  const onStatusChange = vi.fn()
  const onPaymentMethodChange = vi.fn()
  const user = userEvent.setup()
  render(
    <BillingHistoryFilters
      status=''
      paymentMethod=''
      onStatusChange={onStatusChange}
      onPaymentMethodChange={onPaymentMethodChange}
    />
  )

  await user.click(screen.getByRole('combobox', { name: 'Status' }))
  await user.click(await screen.findByRole('option', { name: 'Pending' }))
  await user.click(screen.getByRole('combobox', { name: 'Payment Method' }))
  await user.click(await screen.findByRole('option', { name: 'Alipay' }))

  expect(onStatusChange).toHaveBeenCalledWith('pending')
  expect(onPaymentMethodChange).toHaveBeenCalledWith('alipay')
})
