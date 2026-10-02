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
import {
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  Circle,
  CreditCard,
  KeyRound,
  TerminalSquare,
  type LucideIcon,
} from 'lucide-react'
import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { getApiKeys } from '@/features/keys/api'
import type { ApiKey } from '@/features/keys/types'
import { requireServerSuccess } from '@/lib/server-error-message'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import { useDashboardContentVisibility } from '../../hooks/use-status-data'
import { PerformanceOverview } from '../models/performance-overview'
import { AnalyticsPanel } from './analytics-panel'
import { AnnouncementsPanel } from './announcements-panel'
import { ApiEndpointBar } from './api-endpoint-bar'
import { SummaryCards } from './summary-cards'
import { UptimePanel } from './uptime-panel'

type DashboardActionPath = '/keys' | '/wallet' | '/playground'

interface StartStep {
  title: string
  description: string
  to: DashboardActionPath
  icon: LucideIcon
  completed: boolean
}

function getPreferredKey(keys: ApiKey[]): ApiKey | null {
  return keys.find((item) => item.status === 1) ?? keys[0] ?? null
}

function OnboardingRail(props: { steps: StartStep[] }) {
  const { t } = useTranslation()
  const titleId = useId()
  const completedCount = props.steps.filter((step) => step.completed).length
  const nextStep = props.steps.find((step) => !step.completed)

  if (!nextStep) return null

  const NextIcon = nextStep.icon

  return (
    <section
      aria-labelledby={titleId}
      className='border-border/70 relative overflow-hidden border-y bg-[linear-gradient(100deg,color-mix(in_oklch,var(--primary)_7%,var(--background))_0%,var(--background)_54%,color-mix(in_oklch,var(--chart-2)_5%,var(--background))_100%)] px-4 py-4 sm:px-5'
    >
      <div className='relative flex flex-col gap-4 xl:flex-row xl:items-center'>
        <div className='min-w-44 shrink-0'>
          <div className='text-primary text-xs font-semibold tracking-[0.16em] uppercase'>
            {t('Get started')}
          </div>
          <h3 id={titleId} className='mt-1 text-base font-semibold'>
            {t('Setup progress: {{completed}}/{{total}}', {
              completed: completedCount,
              total: props.steps.length,
            })}
          </h3>
        </div>

        <ol className='flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0'>
          {props.steps.map((step) => {
            const Icon = step.icon
            const StatusIcon = step.completed ? Check : Circle

            return (
              <li
                key={step.title}
                className='border-border/60 relative min-w-0 flex-1 sm:border-l sm:px-4'
              >
                <Link
                  to={step.to}
                  aria-current={
                    !step.completed && step === nextStep ? 'step' : undefined
                  }
                  className='focus-visible:ring-ring group flex h-full min-w-0 items-start gap-2.5 rounded-md py-1 outline-none focus-visible:ring-2'
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border',
                      step.completed
                        ? 'border-success/30 bg-success/10 text-success'
                        : 'bg-background text-muted-foreground'
                    )}
                  >
                    <StatusIcon className='size-3.5' aria-hidden='true' />
                  </span>
                  <span className='min-w-0'>
                    <span className='flex items-center gap-1.5 text-sm font-medium'>
                      <Icon className='size-3.5 shrink-0' aria-hidden='true' />
                      <span className='truncate'>{step.title}</span>
                    </span>
                    <span className='text-muted-foreground mt-0.5 line-clamp-1 text-xs'>
                      {step.description}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>

        <Button
          className='shrink-0 justify-between gap-3 xl:min-w-44'
          render={<Link to={nextStep.to} />}
        >
          <NextIcon data-icon='inline-start' />
          <span>{nextStep.title}</span>
          <ArrowRight data-icon='inline-end' />
        </Button>
      </div>
    </section>
  )
}

export function UserOverviewDashboard() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const { uptimeKuma: showUptimePanel } = useDashboardContentVisibility()

  const requestCount = Number(user?.request_count ?? 0)
  const remainQuota = Number(user?.quota ?? 0)
  const apiKeysQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'api-keys'],
    queryFn: async () => {
      const result = requireServerSuccess(await getApiKeys({ p: 1, size: 10 }))
      return result.success ? (result.data?.items ?? []) : []
    },
    staleTime: 60 * 1000,
  })

  const preferredKey = useMemo(
    () => getPreferredKey(apiKeysQuery.data ?? []),
    [apiKeysQuery.data]
  )

  const startSteps = useMemo<StartStep[]>(
    () => [
      {
        title: t('Create API Key'),
        description: t('Create a key for your app or service'),
        to: '/keys',
        icon: KeyRound,
        completed: Boolean(preferredKey),
      },
      {
        title: t('Add credits'),
        description: t('Keep enough balance before production traffic'),
        to: '/wallet',
        icon: CreditCard,
        completed: remainQuota > 0,
      },
      {
        title: t('Send a request'),
        description: t('Verify routing with Playground or your client'),
        to: '/playground',
        icon: TerminalSquare,
        completed: requestCount > 0,
      },
    ],
    [preferredKey, remainQuota, requestCount, t]
  )

  const setupStatusReady = apiKeysQuery.isSuccess && Boolean(user)

  return (
    <SectionPageLayout stackActionsOnMobile>
      <SectionPageLayout.Title>{t('Overview')}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <div className='grid w-[calc(100vw-1.5rem)] min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:w-auto sm:items-center'>
          <ApiEndpointBar />
          <Button
            variant='outline'
            size='sm'
            render={
              <Link to='/dashboard/$section' params={{ section: 'models' }} />
            }
          >
            <ChartNoAxesCombined data-icon='inline-start' />
            {t('Model Call Analytics')}
          </Button>
        </div>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='mx-auto flex w-full max-w-[1440px] flex-col gap-5'>
          <AnnouncementsPanel />
          <SummaryCards />
          <PerformanceOverview />
          <AnalyticsPanel />
          {setupStatusReady ? <OnboardingRail steps={startSteps} /> : null}
          {showUptimePanel ? <UptimePanel /> : null}
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
