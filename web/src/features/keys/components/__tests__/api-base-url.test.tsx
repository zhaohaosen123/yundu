import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, expect, it, vi } from 'vitest'

import { ApiBaseUrl } from '../api-base-url'

const i18n = createInstance()
await i18n.init({
  lng: 'en',
  resources: { en: { translation: {} } },
  initAsync: false,
})

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(navigator, 'clipboard')
})

it('copies the configured site API base URL from above the key list', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
  render(
    <I18nextProvider i18n={i18n}>
      <ApiBaseUrl serverAddress='https://api.example.com/' />
    </I18nextProvider>
  )

  expect(screen.getByText('https://api.example.com/v1')).toBeVisible()
  await userEvent.click(
    screen.getByRole('button', { name: 'Copy to clipboard' })
  )
  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith('https://api.example.com/v1')
  )
  expect(screen.getByRole('button', { name: 'Copied' })).toBeVisible()
})

it('does not append a second API suffix when the configured address already ends in /v1', () => {
  render(
    <I18nextProvider i18n={i18n}>
      <ApiBaseUrl serverAddress='https://api.example.com/v1/' />
    </I18nextProvider>
  )

  expect(screen.getByText('https://api.example.com/v1')).toBeVisible()
  expect(
    screen.queryByText('https://api.example.com/v1/v1')
  ).not.toBeInTheDocument()
})
