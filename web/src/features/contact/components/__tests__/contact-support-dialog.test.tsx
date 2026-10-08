import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { ContactSupportDialog } from '../contact-support-dialog'

const i18n = createInstance()
await i18n.init({
  lng: 'en',
  resources: { en: { translation: {} } },
  initAsync: false,
})

function renderNotice() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ContactSupportDialog />
    </I18nextProvider>
  )
}

beforeEach(() => {
  window.sessionStorage.clear()
})

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(navigator, 'clipboard')
})

it('shows all support channels on a first visit and copies the selected contact', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
  renderNotice()

  const dialog = screen.getByRole('dialog', { name: 'Contact Us' })
  expect(within(dialog).getByText('3373384211')).toBeVisible()
  expect(within(dialog).getByText('1105295258')).toBeVisible()
  expect(within(dialog).getByText('z18331960227')).toBeVisible()
  expect(
    within(dialog).getByRole('link', { name: '3373384211@QQ.com' })
  ).toHaveAttribute('href', 'mailto:3373384211@QQ.com')

  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Copy to clipboard: QQ Group' })
  )
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('1105295258'))
})

it('stays dismissed after closing and remounting in the same browser session', async () => {
  const view = renderNotice()
  await userEvent.click(screen.getAllByRole('button', { name: 'Close' })[0])
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  )

  view.unmount()
  renderNotice()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
