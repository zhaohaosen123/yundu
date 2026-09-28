/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
*/
import { Route } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { IconBadge } from '@/components/ui/icon-badge'
import { useStatus } from '@/hooks/use-status'

function getCurrentOrigin(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

function buildApiBaseUrl(value: unknown): string {
  const source = typeof value === 'string' ? value.trim() : ''
  const serverAddress = source || getCurrentOrigin()
  if (!serverAddress) return ''
  const normalized = serverAddress.replace(/\/+$/, '')
  if (normalized.endsWith('/v1')) return `${normalized}/`
  if (normalized.endsWith('/v1/chat/completions')) {
    return `${normalized.slice(0, -'/chat/completions'.length)}/`
  }
  return `${normalized}/v1/`
}

export function ApiEndpointBar() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const configuredAddress =
    status?.server_address ??
    status?.serverAddress ??
    status?.data?.server_address ??
    (status?.data as Record<string, unknown> | undefined)?.serverAddress
  const apiBaseUrl = buildApiBaseUrl(configuredAddress)

  if (!apiBaseUrl) return null

  return (
    <div
      className='bg-muted/40 flex h-8 max-w-full min-w-0 items-center gap-2 rounded-md border py-1 pr-1 pl-2'
      aria-labelledby='dashboard-api-url-label'
    >
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <IconBadge tone='info' size='xs'>
          <Route aria-hidden='true' />
        </IconBadge>
        <div className='min-w-0 flex-1'>
          <span id='dashboard-api-url-label' className='sr-only'>
            {t('API URL')}
          </span>
          <div
            className='max-w-[42vw] truncate font-mono text-xs font-medium select-all sm:max-w-52'
            title={apiBaseUrl}
          >
            {apiBaseUrl}
          </div>
        </div>
      </div>
      <CopyButton
        value={apiBaseUrl}
        variant='ghost'
        size='icon'
        className='size-6 shrink-0'
        iconClassName='size-3.5'
        tooltip={t('Copy URL')}
        successTooltip={t('Copied!')}
        aria-label={t('Copy URL')}
      />
    </div>
  )
}
