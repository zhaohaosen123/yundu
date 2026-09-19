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

function getCurrentApiBaseUrl(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/v1/`
}

export function ApiEndpointBar() {
  const { t } = useTranslation()
  const apiBaseUrl = getCurrentApiBaseUrl()

  if (!apiBaseUrl) return null

  return (
    <section
      className='bg-card flex flex-col gap-3 rounded-xl border px-3 py-3 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-4'
      aria-labelledby='dashboard-api-url-label'
    >
      <div className='flex min-w-0 items-center gap-3'>
        <IconBadge tone='info' size='sm'>
          <Route aria-hidden='true' />
        </IconBadge>
        <div className='min-w-0 flex-1'>
          <div
            id='dashboard-api-url-label'
            className='text-muted-foreground text-xs font-medium'
          >
            {t('API URL')}
          </div>
          <div
            className='mt-0.5 select-all overflow-x-auto font-mono text-sm font-medium whitespace-nowrap'
            title={apiBaseUrl}
          >
            {apiBaseUrl}
          </div>
        </div>
      </div>
      <CopyButton
        value={apiBaseUrl}
        variant='outline'
        size='sm'
        className='w-full sm:w-auto'
        tooltip={t('Copy URL')}
        successTooltip={t('Copied!')}
        aria-label={t('Copy URL')}
      >
        <span>{t('Copy URL')}</span>
      </CopyButton>
    </section>
  )
}
