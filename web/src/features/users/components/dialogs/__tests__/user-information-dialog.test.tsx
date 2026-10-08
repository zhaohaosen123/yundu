import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, expect, it, vi } from 'vitest'

import {
  DEFAULT_CURRENCY_CONFIG,
  useSystemConfigStore,
} from '@/stores/system-config-store'

import type { User } from '../../../types'
import { UserInformationDialog } from '../user-information-dialog'

const i18n = createInstance()
await i18n.init({
  lng: 'en',
  resources: { en: { translation: {} } },
  initAsync: false,
})

const user = {
  id: 42,
  username: 'member42',
  display_name: 'Member Forty Two',
  email: 'member@example.com',
  status: 1,
  role: 1,
  group: 'default',
  quota: 1900,
  used_quota: 1100,
  total_tokens: 12345,
  request_count: 27,
} as User

afterEach(() => {
  cleanup()
  useSystemConfigStore
    .getState()
    .setConfig({ currency: { ...DEFAULT_CURRENCY_CONFIG } })
})

it('shows the selected user balance, spending, and token usage in a readable dialog', () => {
  useSystemConfigStore
    .getState()
    .setConfig({ currency: { ...DEFAULT_CURRENCY_CONFIG } })
  render(
    <I18nextProvider i18n={i18n}>
      <UserInformationDialog open onOpenChange={vi.fn()} user={user} />
    </I18nextProvider>
  )

  const dialog = screen.getByRole('dialog', { name: 'User Information' })
  expect(within(dialog).getByText('member@example.com')).toBeVisible()
  expect(within(dialog).getByText('Available Balance')).toBeVisible()
  expect(within(dialog).getByText('Total Used')).toBeVisible()
  expect(within(dialog).getByText('12,345')).toBeVisible()
  expect(within(dialog).getByText('27')).toBeVisible()
})

it('closes with Escape and handles a user without token logs', async () => {
  const onOpenChange = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <UserInformationDialog
        open
        onOpenChange={onOpenChange}
        user={{ ...user, total_tokens: 0 }}
      />
    </I18nextProvider>
  )

  expect(screen.getByText('0')).toBeVisible()
  await userEvent.keyboard('{Escape}')
  expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
})

it('shows unknown token usage when an older server omits the field', () => {
  render(
    <I18nextProvider i18n={i18n}>
      <UserInformationDialog
        open
        onOpenChange={vi.fn()}
        user={{ ...user, total_tokens: undefined }}
      />
    </I18nextProvider>
  )

  const dialog = screen.getByRole('dialog', { name: 'User Information' })
  expect(
    within(dialog).getByText('Total Tokens').nextElementSibling
  ).toHaveTextContent('—')
})
