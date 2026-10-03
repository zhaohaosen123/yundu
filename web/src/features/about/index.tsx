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
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { RichContent } from '@/components/rich-content'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isHttpUrl, isLikelyHtml } from '@/lib/content-format'
import { requireServerSuccess } from '@/lib/server-error-message'

import { getAboutContent } from './api'

function EmptyAboutState() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <div className='flex min-h-[70vh] items-center justify-center py-12'>
      <div className='yundu-content-hero w-full max-w-4xl space-y-7 px-6 py-16 text-center sm:px-12'>
        <div className='flex justify-center'>
          <span className='rounded-2xl border border-emerald-200/25 bg-emerald-300/10 p-5 shadow-[0_0_40px_rgba(116,235,197,0.22)]'>
            <Sparkles className='size-10 text-emerald-200' aria-hidden='true' />
          </span>
        </div>
        <div className='space-y-3'>
          <p className='text-xs font-semibold tracking-[0.24em] text-emerald-200 uppercase'>
            YUNDU / {t('Intelligent access, one gateway')}
          </p>
          <h1 className='text-4xl font-bold'>{t('About')}</h1>
          <p className='mx-auto max-w-xl text-sm leading-7 text-emerald-50/75 sm:text-base'>
            {t(
              'One clean API for the models you build with. Route requests, see usage, and keep control as you grow.'
            )}
          </p>
        </div>
        <div className='flex flex-wrap justify-center gap-3'>
          <Button render={<Link to='/pricing' />}>
            {t('Explore models and pricing')}{' '}
            <ArrowUpRight className='size-4' />
          </Button>
          <Button variant='outline' render={<Link to='/contact' />}>
            {t('Contact Us')}
          </Button>
        </div>
        <details className='border-t border-emerald-100/15 pt-6 text-xs text-emerald-50/65'>
          <summary className='cursor-pointer font-medium text-emerald-100 hover:text-white'>
            {t('Open Source')}
          </summary>
          <div className='space-y-3 pt-4'>
            <p>
              {t('New API Project Repository:')}{' '}
              <a
                href='https://github.com/QuantumNous/new-api'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                {t('https://github.com/QuantumNous/new-api')}
              </a>
            </p>
            <p className='text-muted-foreground'>
              <a
                href='https://github.com/QuantumNous/new-api'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                {t('NewAPI')}
              </a>{' '}
              © {currentYear}{' '}
              <a
                href='https://github.com/QuantumNous'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                {t('QuantumNous')}
              </a>{' '}
              {t('| Based on')}{' '}
              <a
                href='https://github.com/songquanpeng/one-api'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                {t('One API')}
              </a>{' '}
              © 2023{' '}
              <a
                href='https://github.com/songquanpeng'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                {t('JustSong')}
              </a>
            </p>
            <p className='text-muted-foreground'>
              {t('This project must be used in compliance with the')}{' '}
              <a
                href='https://github.com/QuantumNous/new-api/blob/main/LICENSE'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                {t('AGPL v3.0 License')}
              </a>
              .
            </p>
          </div>
        </details>
      </div>
    </div>
  )
}

export function About() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['about-content'],
    queryFn: async () => requireServerSuccess(await getAboutContent()),
  })

  const rawContent = data?.data?.trim() ?? ''
  const hasContent = rawContent.length > 0
  const isUrl = hasContent && isHttpUrl(rawContent)
  const contentIsHtml = hasContent && isLikelyHtml(rawContent)

  if (isLoading) {
    return (
      <PublicLayout>
        <div className='mx-auto flex max-w-4xl flex-col gap-4 py-12'>
          <Skeleton className='h-8 w-[45%]' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-[90%]' />
          <Skeleton className='h-4 w-[80%]' />
        </div>
      </PublicLayout>
    )
  }

  if (!hasContent) {
    return (
      <PublicLayout>
        <EmptyAboutState />
      </PublicLayout>
    )
  }

  if (isUrl) {
    return (
      <PublicLayout showMainContainer={false}>
        <iframe
          src={rawContent}
          className='h-[calc(100vh-3.5rem)] w-full border-0'
          title={t('About')}
          sandbox='allow-forms allow-popups allow-popups-to-escape-sandbox allow-scripts'
        />
      </PublicLayout>
    )
  }

  if (contentIsHtml) {
    return (
      <PublicLayout showMainContainer={false}>
        <RichContent
          mode='html'
          htmlVariant='isolated'
          content={rawContent}
          className='prose-neutral dark:prose-invert max-w-none'
        />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className='yundu-article-frame mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-12'>
        <RichContent
          mode='markdown'
          content={rawContent}
          className='prose-neutral dark:prose-invert max-w-none'
        />
      </div>
    </PublicLayout>
  )
}
