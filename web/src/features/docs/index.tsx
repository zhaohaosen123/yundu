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
import { Link } from '@tanstack/react-router'
import {
  ArrowUpRight,
  BookOpen,
  KeyRound,
  Terminal,
  Waypoints,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

export function Docs() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const user = useAuthStore((state) => state.auth.user)
  const isAuthenticated = Boolean(user)
  const isAdmin = Boolean(user && user.role >= ROLE.ADMIN)
  const configuredAddress = status?.server_address
  const baseUrl =
    (typeof configuredAddress === 'string' && configuredAddress.trim()) ||
    window.location.origin
  const normalizedUrl = baseUrl.replace(/\/+$/, '')
  const apiUrl = normalizedUrl.endsWith('/v1')
    ? normalizedUrl
    : `${normalizedUrl}/v1`
  const example = `curl ${apiUrl}/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"YOUR_MODEL","messages":[{"role":"user","content":"Hello"}]}'`

  return (
    <PublicLayout showMainContainer={false}>
      <main className='mx-auto w-full max-w-7xl px-4 pt-24 pb-20 sm:px-6'>
        <header className='yundu-content-hero px-6 py-12 sm:px-12 sm:py-16'>
          <span className='mb-5 inline-flex size-11 items-center justify-center rounded-lg border border-emerald-200/30 bg-emerald-200/10 text-emerald-200'>
            <BookOpen className='size-5' aria-hidden='true' />
          </span>
          <p className='text-xs font-semibold tracking-[0.2em] text-emerald-200 uppercase'>
            YUNDU / {t('OpenAI Compatible')}
          </p>
          <h1 className='mt-3 text-4xl font-semibold sm:text-5xl'>
            {t('Docs')}
          </h1>
          <p className='mt-4 max-w-xl text-sm leading-7 text-emerald-50/75 sm:text-base'>
            {t('A short path from sign up to building.')}
          </p>
        </header>

        <div className='mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16'>
          <section aria-label={t('footer.columns.docs.links.quickStart')}>
            <h2 className='text-foreground mb-7 text-xl font-semibold'>
              {t('footer.columns.docs.links.quickStart')}
            </h2>
            <ol className='space-y-0'>
              <li className='yundu-doc-step'>
                <span className='yundu-doc-step-icon'>
                  <KeyRound className='size-5' aria-hidden='true' />
                </span>
                <div className='min-w-0'>
                  <span className='text-primary text-xs font-semibold'>01</span>
                  <h3 className='text-foreground mt-1 text-base font-semibold'>
                    {t('Create an API key')}
                  </h3>
                  <p className='text-muted-foreground mt-1 text-sm leading-6'>
                    {t('Give each integration its own secure access.')}
                  </p>
                  {!isAdmin && (
                    <Button
                      className='mt-4'
                      render={
                        <Link to={isAuthenticated ? '/keys' : '/sign-up'} />
                      }
                    >
                      {isAuthenticated ? t('API Keys') : t('Get Started')}
                      <ArrowUpRight className='size-4' aria-hidden='true' />
                    </Button>
                  )}
                </div>
              </li>
              <li className='yundu-doc-step'>
                <span className='yundu-doc-step-icon'>
                  <Waypoints className='size-5' aria-hidden='true' />
                </span>
                <div className='min-w-0'>
                  <span className='text-primary text-xs font-semibold'>02</span>
                  <h3 className='text-foreground mt-1 text-base font-semibold'>
                    {t('Model Pricing')}
                  </h3>
                  <p className='text-muted-foreground mt-1 text-sm leading-6'>
                    {t('Use a familiar API format and choose your model.')}
                  </p>
                  <Button
                    className='mt-4'
                    variant='outline'
                    render={
                      <Link
                        to={isAuthenticated ? '/model-pricing' : '/pricing'}
                      />
                    }
                  >
                    {t('Explore models and pricing')}
                    <ArrowUpRight className='size-4' aria-hidden='true' />
                  </Button>
                </div>
              </li>
              <li className='yundu-doc-step'>
                <span className='yundu-doc-step-icon'>
                  <Terminal className='size-5' aria-hidden='true' />
                </span>
                <div className='min-w-0'>
                  <span className='text-primary text-xs font-semibold'>03</span>
                  <h3 className='text-foreground mt-1 text-base font-semibold'>
                    {t('Send your first request')}
                  </h3>
                  <p className='text-muted-foreground mt-1 text-sm leading-6'>
                    {t('Every request, visible.')}
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section className='min-w-0' aria-label={t('Base URL')}>
            <div className='yundu-doc-api-bar'>
              <div className='min-w-0'>
                <p className='text-muted-foreground text-xs font-medium uppercase'>
                  {t('Base URL')}
                </p>
                <code className='text-foreground mt-2 block text-sm font-semibold break-all'>
                  {apiUrl}
                </code>
              </div>
              <CopyButton value={apiUrl} variant='outline' />
            </div>
            <div className='yundu-doc-code mt-5'>
              <div className='flex items-center justify-between border-b border-emerald-100/15 px-5 py-3'>
                <span className='flex items-center gap-2 text-xs font-semibold text-emerald-200'>
                  <Terminal className='size-4' aria-hidden='true' />
                  POST /v1/chat/completions
                </span>
                <CopyButton
                  value={example}
                  className='text-emerald-100 hover:text-white'
                />
              </div>
              <pre className='overflow-x-auto p-5 text-xs leading-6 text-emerald-50 sm:text-sm'>
                <code>{example}</code>
              </pre>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </PublicLayout>
  )
}
