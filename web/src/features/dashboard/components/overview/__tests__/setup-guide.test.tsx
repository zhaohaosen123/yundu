/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { useSystemConfigStore } from '@/stores/system-config-store'

import { UserOverviewDashboard } from '../overview-dashboard'

let client: QueryClient
let usageError: Error | null
let apiKeyError: Error | null
let apiKeys: Array<{ id: number; name: string; key: string; status: number }>
let announcements: Array<{
  id: number
  content: string
  publishDate: string
  type: 'warning' | 'error'
}>

beforeEach(() => {
  useSystemConfigStore.setState(useSystemConfigStore.getInitialState(), true)
  useAuthStore.getState().auth.setUser({
    id: 1,
    username: 'dashboard-user',
    role: 1,
    quota: 1000000,
    used_quota: 1000,
    request_count: 1,
  })
  client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  usageError = null
  apiKeyError = null
  apiKeys = [{ id: 1, name: 'App key', key: 'masked', status: 1 }]
  announcements = [
    {
      id: 1,
      content: 'Scheduled maintenance tonight at 02:00 UTC.',
      publishDate: '2026-09-20T10:00:00.000Z',
      type: 'error',
    },
    {
      id: 2,
      content: 'A newer routine platform update is available.',
      publishDate: '2026-09-21T10:00:00.000Z',
      type: 'warning',
    },
  ]

  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    switch (url) {
      case '/api/token/?p=1&size=10':
        if (apiKeyError) throw apiKeyError
        return {
          data: {
            success: true,
            data: { items: apiKeys },
          },
        }
      case '/api/status':
        return {
          data: {
            success: true,
            data: {
              api_info_enabled: true,
              api_info: [],
              announcements_enabled: true,
              announcements,
              faq_enabled: true,
              faq: [],
              uptime_kuma_enabled: false,
              server_address: 'https://api.example.com/',
            },
          },
        }
      case '/api/data/self':
        if (usageError) throw usageError
        return {
          data: {
            success: true,
            data: [
              {
                created_at: Math.floor(Date.now() / 1000),
                model_name: 'gpt-5.6-sol-ultra-long-context-preview',
                token_used: 1200,
                count: 3,
                quota: 100,
              },
              {
                created_at: Math.floor(Date.now() / 1000) - 86400,
                model_name: 'claude-4-sonnet',
                token_used: 700,
                count: 2,
                quota: 80,
              },
            ],
          },
        }
      default:
        throw new Error(`Unexpected dashboard request: ${url}`)
    }
  })
})

afterEach(() => {
  cleanup()
  client.clear()
  useAuthStore.setState(useAuthStore.getInitialState(), true)
  useSystemConfigStore.setState(useSystemConfigStore.getInitialState(), true)
  vi.restoreAllMocks()
})

async function renderOverview() {
  const router = createRouter({
    routeTree: createRootRoute({ component: UserOverviewDashboard }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('overview information hierarchy', () => {
  it('puts the announcement and balance before analytics and hides low-value empty panels', async () => {
    const user = userEvent.setup()
    await renderOverview()

    const announcement = await screen.findByRole('button', {
      name: /Announcements:/,
    })
    const usageTitle = screen.getByRole('heading', {
      name: 'Usage at a glance',
    })
    const analyticsTitle = screen.getByText('Usage trends')

    expect(announcement).toBeVisible()
    expect(screen.getByText(/Scheduled maintenance tonight/)).toBeVisible()
    expect(
      announcement.compareDocumentPosition(usageTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      usageTitle.compareDocumentPosition(analyticsTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(screen.queryByText('FAQ')).not.toBeInTheDocument()
    expect(screen.queryByText('API Info')).not.toBeInTheDocument()
    expect(screen.queryByText('Historical Usage')).not.toBeInTheDocument()
    expect(screen.getByText('https://api.example.com/v1/')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Copy URL' }))
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeVisible()
  })

  it('renders model names and keeps metric tabs usable', async () => {
    const user = userEvent.setup()
    await renderOverview()

    expect(
      await screen.findByText('gpt-5.6-sol-ultra-long-context-preview')
    ).toBeVisible()
    expect(screen.getByText('claude-4-sonnet')).toBeVisible()

    const requestTabs = screen.getAllByRole('tab', { name: 'Requests' })
    expect(requestTabs).toHaveLength(2)
    const firstRequestTab = requestTabs[0]
    expect(firstRequestTab).toBeDefined()
    if (!firstRequestTab) return
    await user.click(firstRequestTab)
    expect(requestTabs[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('shows a compact onboarding rail only when the user still needs setup', async () => {
    apiKeys = []
    useAuthStore.getState().auth.setUser({
      id: 1,
      username: 'new-user',
      role: 1,
      quota: 0,
      request_count: 0,
    })
    await renderOverview()

    expect(await screen.findByText('Setup progress: 0/3')).toBeVisible()
    expect(screen.getByText('Get started')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Create API Key' })).toBeVisible()
  })

  it('does not reserve announcement space when the server has no announcements', async () => {
    announcements = []

    await renderOverview()
    await waitFor(() =>
      expect(screen.queryByText('Announcements')).not.toBeInTheDocument()
    )
  })

  it('does not misclassify an existing user when the API key lookup fails', async () => {
    apiKeyError = new Error('API keys unavailable')
    await renderOverview()

    expect(await screen.findByText('claude-4-sonnet')).toBeVisible()
    expect(screen.queryByText(/Setup progress:/)).not.toBeInTheDocument()
    expect(screen.queryByText('Get started')).not.toBeInTheDocument()
  })

  it('shows recoverable states when usage data fails', async () => {
    usageError = new Error('Usage unavailable')
    await renderOverview()

    expect(await screen.findAllByText('Failed to load')).not.toHaveLength(0)
    expect(
      screen.getAllByRole('button', { name: 'Retry' }).length
    ).toBeGreaterThan(0)
    expect(screen.queryByText('No usage data')).not.toBeInTheDocument()
    const summary = screen
      .getByRole('heading', { name: 'Usage at a glance' })
      .closest('section')
    expect(summary).not.toBeNull()
    if (summary) {
      expect(within(summary).getAllByText('--')).toHaveLength(3)
    }
  })
})
