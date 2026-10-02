/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Hero } from '../sections/hero'

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { to: string; children?: React.ReactNode }) => (
    <a href={props.to}>{props.children}</a>
  ),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { model?: string }) =>
      key.replace('{{model}}', values?.model ?? ''),
  }),
}))

describe('home route preview', () => {
  it('updates the selected model when a visitor chooses a route', async () => {
    const user = userEvent.setup()
    render(<Hero />)

    const openAi = screen.getByRole('button', { name: 'Preview OpenAI route' })
    const claude = screen.getByRole('button', { name: 'Preview Claude route' })
    expect(openAi).toHaveAttribute('aria-pressed', 'true')

    await user.click(claude)

    expect(claude).toHaveAttribute('aria-pressed', 'true')
    expect(openAi).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('CLAUDE')).toBeVisible()
  })
})
