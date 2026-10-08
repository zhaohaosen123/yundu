import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, expect, it } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'

import type { User } from '../../types'
import { DataTableRowActions } from '../data-table-row-actions'
import { UsersProvider } from '../users-provider'

const i18n = createInstance()
await i18n.init({
  lng: 'en',
  resources: { en: { translation: {} } },
  initAsync: false,
})

function DeletedUserActions() {
  const table = useReactTable({
    data: [
      {
        id: 42,
        username: 'archived-member',
        display_name: 'Archived Member',
        role: 1,
        status: 1,
        quota: 0,
        used_quota: 1200,
        total_tokens: 5000,
        request_count: 4,
        group: 'default',
        DeletedAt: { Valid: true },
      } as User,
    ],
    columns: [{ id: 'actions' }],
    getCoreRowModel: getCoreRowModel(),
  })
  return <DataTableRowActions row={table.getRowModel().rows[0]} />
}

afterEach(cleanup)

it('keeps read-only user information available for a deleted account', async () => {
  render(
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <UsersProvider>
          <DeletedUserActions />
        </UsersProvider>
      </TooltipProvider>
    </I18nextProvider>
  )

  expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  await userEvent.click(
    screen.getByRole('button', { name: 'User Information' })
  )
  const dialog = screen.getByRole('dialog', { name: 'User Information' })
  expect(within(dialog).getByText('Deleted')).toBeVisible()
  expect(within(dialog).getByText('5,000')).toBeVisible()
})
