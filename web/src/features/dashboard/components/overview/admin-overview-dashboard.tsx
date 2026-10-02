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
  Activity,
  ArrowUpRight,
  BadgeDollarSign,
  CircleDollarSign,
  Clock3,
  CreditCard,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { StatusBadge, type StatusVariant } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/features/wallet/lib'
import { toIntlLocale } from '@/i18n/languages'
import {
  formatCompactNumber,
  formatNumber,
  formatTimestampRelative,
} from '@/lib/format'
import { requireServerSuccess } from '@/lib/server-error-message'
import { cn } from '@/lib/utils'

import { getAdminOverview } from '../../api'
import { DASHBOARD_REFRESH_INTERVAL_MS } from '../../constants'
import type { AdminOverviewData, AdminOverviewSummary } from '../../types'
import { AdminOverviewCharts } from './admin-overview-charts'

const ADMIN_OVERVIEW_PERIODS = [7, 14, 30] as const
type AdminOverviewPeriod = (typeof ADMIN_OVERVIEW_PERIODS)[number]

type Metric = {
  key: string
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone: 'jade' | 'gold' | 'blue' | 'rose'
}

const METRIC_TONES: Record<Metric['tone'], string> = {
  jade: 'bg-success/12 text-success',
  gold: 'bg-warning/14 text-warning',
  blue: 'bg-info/12 text-info',
  rose: 'bg-destructive/10 text-destructive',
}

function AdminMetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon

  return (
    <Card data-yundu-interactive className='min-w-0 overflow-hidden'>
      <CardContent className='flex min-h-32 flex-col justify-between p-4 sm:p-5'>
        <div className='flex items-start justify-between gap-3'>
          <span className='text-muted-foreground text-xs font-medium'>
            {metric.label}
          </span>
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-md',
              METRIC_TONES[metric.tone]
            )}
          >
            <Icon className='size-4' aria-hidden='true' />
          </span>
        </div>
        <div className='mt-5'>
          <div className='font-mono text-2xl font-semibold tabular-nums'>
            {metric.value}
          </div>
          <p className='text-muted-foreground mt-1 truncate text-xs'>
            {metric.detail}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function AdminOverviewSkeleton() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6'>
        {['users', 'active', 'tokens', 'revenue', 'paying', 'pending'].map(
          (key) => (
            <Skeleton key={key} className='h-32 rounded-lg' />
          )
        )}
      </div>
      <div className='grid gap-4 xl:grid-cols-2'>
        <Skeleton className='h-80 rounded-lg' />
        <Skeleton className='h-80 rounded-lg' />
        <Skeleton className='h-80 rounded-lg xl:col-span-2 2xl:col-span-1' />
      </div>
    </div>
  )
}

function getTopUpStatus(status: string): {
  labelKey: string
  variant: StatusVariant
} {
  if (status === 'success') {
    return { labelKey: 'Success', variant: 'success' }
  }
  if (status === 'pending') {
    return { labelKey: 'Pending', variant: 'warning' }
  }
  return { labelKey: 'Failed', variant: 'danger' }
}

function buildMetrics(
  summary: AdminOverviewSummary,
  t: ReturnType<typeof useTranslation>['t']
): Metric[] {
  return [
    {
      key: 'users',
      label: t('Total users'),
      value: formatNumber(summary.total_users),
      detail: `${formatNumber(summary.enabled_users)} ${t('Enabled')} · ${t('{{count}} new today', { count: summary.new_users_today })}`,
      icon: Users,
      tone: 'blue',
    },
    {
      key: 'active',
      label: t('Active today'),
      value: formatNumber(summary.active_users_today),
      detail: t('{{count}} active in 30 days', {
        count: summary.active_users_30_days,
      }),
      icon: UserCheck,
      tone: 'jade',
    },
    {
      key: 'tokens',
      label: t('Tokens today'),
      value: formatCompactNumber(summary.tokens_today),
      detail: t('{{count}} requests today', {
        count: formatNumber(summary.requests_today),
      }),
      icon: Activity,
      tone: 'blue',
    },
    {
      key: 'revenue',
      label: t('Revenue today'),
      value: formatCurrency(summary.revenue_today),
      detail: t('{{amount}} in 30 days', {
        amount: formatCurrency(summary.revenue_30_days),
      }),
      icon: CircleDollarSign,
      tone: 'gold',
    },
    {
      key: 'paying-users',
      label: t('Paying users (30 days)'),
      value: formatNumber(summary.paying_users_30_days),
      detail: t('{{count}} completed top-ups', {
        count: summary.completed_topups,
      }),
      icon: WalletCards,
      tone: 'jade',
    },
    {
      key: 'pending',
      label: t('Pending orders'),
      value: formatNumber(summary.pending_topups),
      detail: t('{{amount}} total revenue', {
        amount: formatCurrency(summary.revenue_total),
      }),
      icon: Clock3,
      tone: summary.pending_topups > 0 ? 'rose' : 'jade',
    },
  ]
}

function EmptyList({ children }: { children: React.ReactNode }) {
  return (
    <div className='text-muted-foreground flex min-h-40 items-center justify-center px-4 text-center text-sm'>
      {children}
    </div>
  )
}

function AdminOverviewContent({ data }: { data: AdminOverviewData }) {
  const { t, i18n } = useTranslation()
  const metrics = useMemo(() => buildMetrics(data.summary, t), [data, t])
  const intlLocale = toIntlLocale(i18n.resolvedLanguage || i18n.language)

  return (
    <div className='flex flex-col gap-4'>
      <section className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6'>
        {metrics.map((metric) => (
          <AdminMetricCard key={metric.key} metric={metric} />
        ))}
      </section>

      <AdminOverviewCharts trend={data.trend} periodDays={data.period_days} />

      <section className='grid gap-4 xl:grid-cols-2'>
        <Card data-yundu-interactive className='min-w-0 overflow-hidden'>
          <CardHeader className='flex flex-row items-center justify-between gap-3 border-b'>
            <div>
              <CardTitle>{t('Latest registrations')}</CardTitle>
              <CardDescription>
                {t('Newest accounts across the platform')}
              </CardDescription>
            </div>
            <Button variant='ghost' size='sm' render={<Link to='/users' />}>
              {t('View all')}
              <ArrowUpRight data-icon='inline-end' />
            </Button>
          </CardHeader>
          <CardContent className='p-0'>
            {data.recent_users.length === 0 ? (
              <EmptyList>{t('No recent registrations')}</EmptyList>
            ) : (
              <div className='divide-y'>
                {data.recent_users.map((user) => (
                  <div
                    key={user.id}
                    className='group hover:bg-accent/60 flex min-w-0 items-center gap-3 px-4 py-3 transition-colors sm:px-5'
                  >
                    <span className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md text-xs font-semibold'>
                      {(user.display_name || user.username)
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <div className='min-w-0 flex-1'>
                      <div className='truncate text-sm font-medium'>
                        {user.display_name || user.username}
                      </div>
                      <div className='text-muted-foreground truncate text-xs'>
                        @{user.username} · {user.group}
                      </div>
                    </div>
                    <div className='text-muted-foreground shrink-0 text-right text-xs'>
                      {formatTimestampRelative(
                        user.created_at,
                        'seconds',
                        intlLocale
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-yundu-interactive className='min-w-0 overflow-hidden'>
          <CardHeader className='flex flex-row items-center justify-between gap-3 border-b'>
            <div>
              <CardTitle>{t('Latest payments')}</CardTitle>
              <CardDescription>
                {t('Newest top-up activity across all accounts')}
              </CardDescription>
            </div>
            <Button variant='ghost' size='sm' render={<Link to='/wallet' />}>
              {t('View all')}
              <ArrowUpRight data-icon='inline-end' />
            </Button>
          </CardHeader>
          <CardContent className='p-0'>
            {data.recent_topups.length === 0 ? (
              <EmptyList>{t('No recent payments')}</EmptyList>
            ) : (
              <div className='divide-y'>
                {data.recent_topups.map((topUp) => {
                  const status = getTopUpStatus(topUp.status)
                  return (
                    <div
                      key={topUp.id}
                      className='group hover:bg-accent/60 flex min-w-0 items-center gap-3 px-4 py-3 transition-colors sm:px-5'
                    >
                      <span className='bg-warning/12 text-warning flex size-9 shrink-0 items-center justify-center rounded-md'>
                        <CreditCard className='size-4' aria-hidden='true' />
                      </span>
                      <div className='min-w-0 flex-1'>
                        <div className='truncate text-sm font-medium'>
                          {topUp.username || `${t('User ID')} ${topUp.user_id}`}
                        </div>
                        <div className='text-muted-foreground truncate text-xs'>
                          {topUp.payment_method || t('Unknown')}
                        </div>
                      </div>
                      <div className='shrink-0 text-right'>
                        <div className='font-mono text-sm font-semibold tabular-nums'>
                          {formatCurrency(topUp.money)}
                        </div>
                        <StatusBadge
                          label={t(status.labelKey)}
                          variant={status.variant}
                          size='sm'
                          copyable={false}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        {[
          {
            to: '/users' as const,
            icon: UserPlus,
            title: t('Users'),
            detail: t('Accounts, roles, balances, and access'),
          },
          {
            to: '/wallet' as const,
            icon: BadgeDollarSign,
            title: t('Billing History'),
            detail: t('Revenue, orders, and payment status'),
          },
          {
            to: '/channels' as const,
            icon: ServerCog,
            title: t('Channels'),
            detail: t('Availability, routing, and upstream health'),
          },
          {
            to: '/system-settings/site' as const,
            icon: ShieldCheck,
            title: t('System Settings'),
            detail: t('Branding, policy, security, and limits'),
          },
        ].map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.to}
              to={action.to}
              className='group focus-visible:ring-ring rounded-lg outline-none focus-visible:ring-2'
            >
              <Card data-yundu-interactive className='h-full'>
                <CardContent className='flex items-center gap-3 p-4'>
                  <span className='bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md'>
                    <Icon
                      className='size-5 transition-transform duration-200 group-hover:scale-110'
                      aria-hidden='true'
                    />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='text-sm font-semibold'>{action.title}</div>
                    <div className='text-muted-foreground mt-0.5 line-clamp-2 text-xs'>
                      {action.detail}
                    </div>
                  </div>
                  <ArrowUpRight
                    className='text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                    aria-hidden='true'
                  />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </section>
    </div>
  )
}

export function AdminOverviewDashboard() {
  const { t, i18n } = useTranslation()
  const [periodDays, setPeriodDays] = useState<AdminOverviewPeriod>(14)
  const intlLocale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const query = useQuery({
    queryKey: ['dashboard', 'admin-overview', periodDays],
    queryFn: async () =>
      requireServerSuccess(await getAdminOverview(periodDays)).data,
    placeholderData: (previousData) => previousData,
    staleTime: 60_000,
    refetchInterval: DASHBOARD_REFRESH_INTERVAL_MS,
  })

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        <span className='flex min-w-0 items-center gap-2'>
          <span>{t('Operations overview')}</span>
          <Badge variant='outline' className='hidden sm:inline-flex'>
            {t('Global')}
          </Badge>
        </span>
      </SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Tabs
          value={String(periodDays)}
          onValueChange={(value) =>
            setPeriodDays(Number(value) as AdminOverviewPeriod)
          }
          className='shrink-0'
        >
          <TabsList aria-label={t('Time range')}>
            {ADMIN_OVERVIEW_PERIODS.map((days) => (
              <TabsTrigger
                key={days}
                value={String(days)}
                className='px-2 text-xs sm:px-2.5'
              >
                {days} {t('days')}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <span className='text-muted-foreground hidden text-xs lg:inline'>
          {query.data
            ? t('Updated {{time}}', {
                time: formatTimestampRelative(
                  query.data.generated_at,
                  'seconds',
                  intlLocale
                ),
              })
            : null}
        </span>
        <Button
          variant='outline'
          size='sm'
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCw
            data-icon='inline-start'
            className={cn(query.isFetching && 'animate-spin')}
          />
          {t('Refresh')}
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        {query.isPending ? <AdminOverviewSkeleton /> : null}
        {query.isError ? (
          <Card>
            <CardContent className='flex min-h-64 flex-col items-center justify-center gap-3 text-center'>
              <ServerCog
                className='text-muted-foreground size-8'
                aria-hidden='true'
              />
              <div>
                <p className='font-medium'>{t('Failed to load')}</p>
                <p className='text-muted-foreground mt-1 text-sm'>
                  {t('Unable to load the global operations overview.')}
                </p>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => void query.refetch()}
              >
                {t('Retry')}
              </Button>
            </CardContent>
          </Card>
        ) : null}
        {query.data ? <AdminOverviewContent data={query.data} /> : null}
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
