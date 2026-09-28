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
import { ArrowRight, RefreshCw, ShieldCheck, TrendingDown } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { getUserQuotaDates } from '@/features/dashboard/api'
import { DASHBOARD_REFRESH_INTERVAL_MS } from '@/features/dashboard/constants'
import { useSummaryCardsConfig } from '@/features/dashboard/hooks/use-dashboard-config'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { useStatus } from '@/hooks/use-status'
import { getCurrencyLabel, isCurrencyDisplayEnabled } from '@/lib/currency'
import { formatNumber, formatQuota } from '@/lib/format'
import { requireServerSuccess } from '@/lib/server-error-message'
import { computeTimeRange } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import { StatCard } from '../ui/stat-card'

const SUMMARY_SPARKLINE_BUCKETS = 12

type SummarySparklineKey = 'balance' | 'usage' | 'requests' | 'tokens'

function getBucketIndex(
  timestamp: number,
  start: number,
  end: number,
  bucketCount: number
): number {
  if (end <= start) return 0
  const ratio = (timestamp - start) / (end - start)
  return Math.min(bucketCount - 1, Math.max(0, Math.floor(ratio * bucketCount)))
}

function buildSummarySparklines(
  data: QuotaDataItem[],
  currentBalance: number,
  start: number,
  end: number
): Record<SummarySparklineKey, number[]> {
  const usage = Array.from({ length: SUMMARY_SPARKLINE_BUCKETS }, () => 0)
  const requests = Array.from({ length: SUMMARY_SPARKLINE_BUCKETS }, () => 0)
  const tokens = Array.from({ length: SUMMARY_SPARKLINE_BUCKETS }, () => 0)

  for (const item of data) {
    const timestamp = Number(item.created_at) || start
    const index = getBucketIndex(
      timestamp,
      start,
      end,
      SUMMARY_SPARKLINE_BUCKETS
    )
    usage[index] += Number(item.quota) || 0
    requests[index] += Number(item.count) || 0
    tokens[index] += Number(item.token_used) || 0
  }

  let balance = currentBalance
  const balanceTrend = Array.from(
    { length: SUMMARY_SPARKLINE_BUCKETS },
    () => 0
  )

  for (let index = SUMMARY_SPARKLINE_BUCKETS - 1; index >= 0; index--) {
    balanceTrend[index] = Math.max(0, balance)
    balance += usage[index]
  }

  return {
    balance: balanceTrend,
    usage,
    requests,
    tokens,
  }
}

function getSummarySparkline(
  key: string,
  sparklineData: Record<SummarySparklineKey, number[]>
): number[] | undefined {
  if (key === 'usage') return sparklineData.usage
  if (key === 'requests') return sparklineData.requests
  if (key === 'tokens') return sparklineData.tokens
  return undefined
}

function getRunwayDays(
  remainQuota: number,
  recentUsage: number
): number | null {
  if (remainQuota <= 0 || recentUsage <= 0) return null
  const days = remainQuota / recentUsage
  if (!Number.isFinite(days)) return null
  return days
}

type HealthLevel = 'healthy' | 'caution' | 'critical'

function getHealthLevel(remainQuota: number, recentUsage: number): HealthLevel {
  if (remainQuota <= 0) return 'critical'
  const days = getRunwayDays(remainQuota, recentUsage)
  if (days !== null && days < 3) return 'caution'
  return 'healthy'
}

const HEALTH_CONFIG: Record<
  HealthLevel,
  { dotClass: string; labelKey: string }
> = {
  healthy: {
    dotClass: 'bg-success',
    labelKey: 'Healthy',
  },
  caution: {
    dotClass: 'bg-warning',
    labelKey: 'Low balance',
  },
  critical: {
    dotClass: 'bg-destructive',
    labelKey: 'Balance depleted',
  },
}

export function SummaryCards() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const { status, loading } = useStatus()

  const summaryTimeRange = computeTimeRange(1)
  const remainQuota = Number(user?.quota ?? 0)

  const usageTrendQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'summary-sparklines'],
    queryFn: async () => {
      const range = computeTimeRange(1)
      return requireServerSuccess(
        await getUserQuotaDates({
          start_timestamp: range.start_timestamp,
          end_timestamp: range.end_timestamp,
          default_time: 'hour',
        })
      )
    },
    staleTime: 60 * 1000,
    refetchInterval: DASHBOARD_REFRESH_INTERVAL_MS,
  })

  const currencyEnabledFromStore = isCurrencyDisplayEnabled()
  const statusCurrencyFlag =
    typeof status?.display_in_currency === 'boolean'
      ? Boolean(status.display_in_currency)
      : undefined
  const currencyEnabled =
    statusCurrencyFlag !== undefined
      ? statusCurrencyFlag
      : currencyEnabledFromStore
  const currencyLabel = currencyEnabled ? getCurrencyLabel() : 'Tokens'

  const sparklineData = useMemo(
    () =>
      buildSummarySparklines(
        usageTrendQuery.data?.data ?? [],
        remainQuota,
        summaryTimeRange.start_timestamp,
        summaryTimeRange.end_timestamp
      ),
    [
      remainQuota,
      summaryTimeRange.end_timestamp,
      summaryTimeRange.start_timestamp,
      usageTrendQuery.data?.data,
    ]
  )

  const recentUsage = useMemo(
    () =>
      (usageTrendQuery.data?.data ?? []).reduce(
        (total, item) => total + (Number(item.quota) || 0),
        0
      ),
    [usageTrendQuery.data?.data]
  )
  const recentRequests = useMemo(
    () =>
      (usageTrendQuery.data?.data ?? []).reduce(
        (total, item) => total + (Number(item.count) || 0),
        0
      ),
    [usageTrendQuery.data?.data]
  )
  const recentTokens = useMemo(
    () =>
      (usageTrendQuery.data?.data ?? []).reduce(
        (total, item) => total + (Number(item.token_used) || 0),
        0
      ),
    [usageTrendQuery.data?.data]
  )

  const usageUnavailable = usageTrendQuery.isError
  const healthLevel = getHealthLevel(remainQuota, recentUsage)
  const healthCfg =
    usageUnavailable && remainQuota > 0
      ? { dotClass: 'bg-muted-foreground', labelKey: 'Failed to load' }
      : HEALTH_CONFIG[healthLevel]
  const runwayDays = getRunwayDays(remainQuota, recentUsage)

  const todayUsageDisplay = formatQuota(recentUsage)
  let runwayDisplay: string
  if (usageUnavailable && remainQuota > 0) {
    runwayDisplay = t('Failed to load')
  } else if (runwayDays !== null) {
    if (runwayDays < 1) {
      runwayDisplay = t('Less than 1 day left')
    } else if (runwayDays > 999) {
      runwayDisplay = `999+ ${t('days')}`
    } else {
      runwayDisplay = `~${formatNumber(Math.floor(runwayDays))} ${t('days')}`
    }
  } else if (remainQuota <= 0) {
    runwayDisplay = t('Balance depleted')
  } else {
    runwayDisplay = t('No recent usage')
  }

  const items = useSummaryCardsConfig({
    todayUsageDisplay,
    todayRequestsDisplay: formatNumber(recentRequests),
    todayTokensDisplay: formatNumber(recentTokens),
    currencyEnabled,
    currencyLabel,
  }).map((config, index) => {
    const tones = ['accent-1', 'accent-2', 'accent-3'] as const

    return {
      key: config.key,
      title: config.title,
      value: config.value,
      desc: config.description,
      icon: config.icon,
      tone: tones[index] ?? 'accent-3',
      sparkline:
        config.key === 'todayUsage'
          ? sparklineData.usage
          : getSummarySparkline(config.key, sparklineData),
      sparklineVariant: 'line' as const,
      loading: loading || usageTrendQuery.isPending,
      error: usageUnavailable,
    }
  })
  let runwayIcon: ReactNode
  if (usageUnavailable && remainQuota > 0) {
    runwayIcon = (
      <RefreshCw className='text-muted-foreground size-4' aria-hidden='true' />
    )
  } else if (healthLevel === 'healthy') {
    runwayIcon = (
      <ShieldCheck className='text-success size-4' aria-hidden='true' />
    )
  } else {
    runwayIcon = (
      <TrendingDown
        className={cn(
          'size-4',
          healthLevel === 'critical' ? 'text-destructive' : 'text-warning'
        )}
        aria-hidden='true'
      />
    )
  }

  return (
    <section className='border-border/70 bg-card overflow-hidden border-y'>
      <div className='grid xl:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)]'>
        <div className='border-border/70 relative flex min-h-60 flex-col justify-between overflow-hidden border-b bg-[linear-gradient(145deg,color-mix(in_oklch,var(--primary)_10%,var(--card))_0%,var(--card)_58%,color-mix(in_oklch,var(--chart-2)_6%,var(--card))_100%)] p-5 sm:p-6 xl:border-r xl:border-b-0'>
          <div className='border-primary/10 pointer-events-none absolute -top-20 -right-16 size-56 rounded-full border' />
          <div className='border-primary/10 pointer-events-none absolute -top-8 -right-4 size-32 rounded-full border' />

          <div className='relative flex items-center justify-between gap-3'>
            <span className='text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase'>
              {t('Credit remaining')}
            </span>
            <span className='bg-background/70 flex items-center gap-1.5 rounded-full border px-2.5 py-1'>
              <span
                className={cn('size-1.5 rounded-full', healthCfg.dotClass)}
                aria-hidden='true'
              />
              <span className='text-muted-foreground text-[11px] font-medium'>
                {t(healthCfg.labelKey)}
              </span>
            </span>
          </div>

          <div className='relative py-5'>
            <div className='font-mono text-4xl font-semibold tracking-[-0.05em] tabular-nums sm:text-5xl'>
              {formatQuota(remainQuota)}
            </div>
            <div className='mt-4 flex items-center gap-2'>
              {runwayIcon}
              <span className='text-muted-foreground text-sm'>
                {t('Runway')}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  healthLevel === 'critical' && 'text-destructive',
                  healthLevel === 'caution' && 'text-warning'
                )}
              >
                {runwayDisplay}
              </span>
            </div>
          </div>

          <Button
            variant='outline'
            className='bg-background/70 relative w-full justify-between sm:w-44'
            render={<Link to='/wallet' />}
          >
            <span>{t('Wallet')}</span>
            <ArrowRight data-icon='inline-end' />
          </Button>
        </div>

        <div className='flex min-w-0 flex-col px-4 py-5 sm:px-6 sm:py-6'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <h3 className='text-base font-semibold sm:text-lg'>
                {t('Usage at a glance')}
              </h3>
              <p className='text-muted-foreground mt-1 text-xs sm:text-sm'>
                {t('Monitor balance, usage, and request volume')}
              </p>
            </div>
            {usageUnavailable ? (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => void usageTrendQuery.refetch()}
              >
                <RefreshCw data-icon='inline-start' />
                {t('Retry')}
              </Button>
            ) : null}
          </div>

          <div className='border-border/60 mt-5 grid flex-1 divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
            {items.map((item) => (
              <div
                key={item.key}
                className='min-w-0 px-1 py-4 sm:px-5 sm:py-5 first:sm:pl-0 last:sm:pr-0'
              >
                <StatCard
                  title={item.title}
                  value={item.value}
                  description={item.desc}
                  icon={item.icon}
                  tone={item.tone}
                  sparkline={item.sparkline}
                  sparklineVariant={item.sparklineVariant}
                  loading={item.loading}
                  error={item.error}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
