/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
*/
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Activity,
  AlertCircle,
  Coins,
  Hash,
  PieChart as PieChartIcon,
  RefreshCw,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserQuotaDates } from '@/features/dashboard/api'
import { DASHBOARD_REFRESH_INTERVAL_MS } from '@/features/dashboard/constants'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { formatNumber, formatQuota } from '@/lib/format'
import { requireServerSuccess } from '@/lib/server-error-message'
import { computeTimeRange } from '@/lib/time'
import { cn } from '@/lib/utils'

type Metric = 'tokens' | 'requests' | 'spend'

const METRICS: Array<{ key: Metric; icon: typeof Activity; label: string }> = [
  { key: 'tokens', icon: Hash, label: 'Token usage' },
  { key: 'requests', icon: Activity, label: 'Requests' },
  { key: 'spend', icon: Coins, label: 'Spend' },
]
const EMPTY_DATA: QuotaDataItem[] = []

function getTimestamp(value: number): number {
  return value > 10_000_000_000 ? value : value * 1000
}

function getMetricValue(item: QuotaDataItem, metric: Metric): number {
  if (metric === 'tokens') return Number(item.token_used) || 0
  if (metric === 'requests') return Number(item.count) || 0
  return Number(item.quota) || 0
}

function formatMetricValue(value: unknown, metric: Metric): string {
  const amount = Number(value) || 0
  if (metric === 'spend') return formatQuota(amount)
  return formatNumber(amount)
}

function buildTrend(data: QuotaDataItem[], metric: Metric) {
  const buckets = new Map<number, { label: string; value: number }>()
  for (const item of data) {
    const date = new Date(getTimestamp(Number(item.created_at) || 0))
    if (Number.isNaN(date.getTime())) continue

    const dayKey = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    const label = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    const existing = buckets.get(dayKey)
    buckets.set(dayKey, {
      label,
      value: (existing?.value ?? 0) + getMetricValue(item, metric),
    })
  }
  return [...buckets.entries()]
    .sort(([first], [second]) => first - second)
    .map(([, bucket]) => ({ date: bucket.label, value: bucket.value }))
}

const MODEL_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function buildModelUsage(
  data: QuotaDataItem[],
  metric: Metric,
  labels: { unknown: string; other: string }
) {
  const totals = new Map<string, number>()
  for (const item of data) {
    const model = item.model_name?.trim() || labels.unknown
    totals.set(model, (totals.get(model) ?? 0) + getMetricValue(item, metric))
  }

  const sorted = Array.from(totals, ([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
  const otherValue = [...totals.values()]
    .sort((a, b) => b - a)
    .slice(5)
    .reduce((sum, value) => sum + value, 0)

  if (otherValue > 0) sorted.push({ name: labels.other, value: otherValue })
  return sorted
}

function MetricTabs(props: {
  value: Metric
  onChange: (metric: Metric) => void
  ariaLabel: string
  prefix?: string
}) {
  const { t } = useTranslation()

  return (
    <div
      className='bg-muted flex items-center gap-1 rounded-md p-1'
      role='tablist'
      aria-label={props.ariaLabel}
    >
      {METRICS.map((item) => {
        const Icon = item.icon
        return (
          <Button
            key={`${props.prefix ?? ''}${item.key}`}
            type='button'
            variant={props.value === item.key ? 'secondary' : 'ghost'}
            size='sm'
            className={cn(
              'h-7 gap-1.5 px-2 text-xs',
              props.value === item.key && 'shadow-sm'
            )}
            onClick={() => props.onChange(item.key)}
            role='tab'
            aria-selected={props.value === item.key}
          >
            <Icon className='size-3.5' aria-hidden='true' />
            <span>{t(item.label)}</span>
          </Button>
        )
      })}
    </div>
  )
}

function AnalyticsErrorState(props: {
  onRetry: () => void
  className?: string
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-center',
        props.className
      )}
    >
      <AlertCircle className='text-destructive size-5' aria-hidden='true' />
      <p className='text-muted-foreground text-sm'>{t('Failed to load')}</p>
      <Button type='button' variant='outline' size='sm' onClick={props.onRetry}>
        <RefreshCw data-icon='inline-start' />
        {t('Retry')}
      </Button>
    </div>
  )
}

export function AnalyticsPanel() {
  const { t } = useTranslation()
  const [trendMetric, setTrendMetric] = useState<Metric>('tokens')
  const [modelMetric, setModelMetric] = useState<Metric>('tokens')
  const query = useQuery({
    queryKey: ['dashboard', 'overview', 'analytics'],
    queryFn: async () => {
      const range = computeTimeRange(14)
      return requireServerSuccess(
        await getUserQuotaDates({
          start_timestamp: range.start_timestamp,
          end_timestamp: range.end_timestamp,
          default_time: 'day',
        })
      )
    },
    staleTime: 60 * 1000,
    refetchInterval: DASHBOARD_REFRESH_INTERVAL_MS,
  })
  const data = query.data?.data ?? EMPTY_DATA
  const trend = useMemo(
    () => buildTrend(data, trendMetric),
    [data, trendMetric]
  )
  const modelUsage = useMemo(
    () =>
      buildModelUsage(data, modelMetric, {
        unknown: t('Unknown model'),
        other: t('Other models'),
      }),
    [data, modelMetric, t]
  )
  const modelRanking = modelUsage.slice(0, 6)
  const modelLoading = query.isPending
  const hasModelUsage = modelUsage.length > 0
  const modelUsageTotal = useMemo(
    () => modelUsage.reduce((sum, item) => sum + item.value, 0),
    [modelUsage]
  )

  if (!query.isPending && !query.isError && data.length === 0) {
    return (
      <section className='border-border/70 bg-muted/15 flex flex-col gap-3 border-y px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
        <div>
          <h3 className='text-sm font-semibold'>{t('Usage trends')}</h3>
          <p className='text-muted-foreground mt-1 text-xs'>
            {t('No usage data')}
          </p>
        </div>
        <Button size='sm' render={<Link to='/playground' />}>
          {t('Send a request')}
        </Button>
      </section>
    )
  }

  return (
    <div className='grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]'>
      <Card className='border-border/70 min-w-0 rounded-lg border shadow-none xl:order-1'>
        <CardHeader className='border-border/70 flex flex-row flex-wrap items-center justify-between gap-3 border-b pb-4'>
          <div>
            <CardTitle>{t('Usage trends')}</CardTitle>
            <p className='text-muted-foreground mt-1 text-xs'>
              {t('Last 14 days')}
            </p>
          </div>
          <MetricTabs
            value={trendMetric}
            onChange={setTrendMetric}
            ariaLabel={t('Usage metric')}
          />
        </CardHeader>
        <CardContent className='h-52 pt-5 sm:h-72'>
          {query.isPending && (
            <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>
              {t('Loading')}
            </div>
          )}
          {query.isError && (
            <AnalyticsErrorState
              className='h-full'
              onRetry={() => void query.refetch()}
            />
          )}
          {!query.isPending && !query.isError && trend.length === 0 && (
            <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>
              {t('No usage data')}
            </div>
          )}
          {!query.isPending && !query.isError && trend.length > 0 && (
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={trend}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  stroke='var(--border)'
                  strokeDasharray='3 3'
                  vertical={false}
                />
                <XAxis
                  dataKey='date'
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  width={42}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    fontSize: 12,
                  }}
                  formatter={(value: unknown) => [
                    formatMetricValue(value, trendMetric),
                    t(
                      METRICS.find((item) => item.key === trendMetric)?.label ??
                        ''
                    ),
                  ]}
                />
                <Line
                  type='monotone'
                  dataKey='value'
                  stroke='var(--chart-1)'
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className='border-border/70 min-w-0 rounded-lg border shadow-none xl:order-2'>
        <CardHeader className='border-border/70 flex flex-row flex-wrap items-center justify-between gap-3 border-b pb-4'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <PieChartIcon
                className='text-muted-foreground size-4'
                aria-hidden='true'
              />
              {t('Model usage distribution')}
            </CardTitle>
            <p className='text-muted-foreground mt-1 text-xs'>
              {t('Compare usage across models')}
            </p>
          </div>
          <MetricTabs
            value={modelMetric}
            onChange={setModelMetric}
            ariaLabel={t('Model usage metric')}
            prefix='model-'
          />
        </CardHeader>
        <CardContent className='pt-4'>
          {modelLoading && (
            <div className='text-muted-foreground flex h-56 items-center justify-center text-sm md:col-span-2'>
              {t('Loading')}
            </div>
          )}
          {query.isError && (
            <AnalyticsErrorState
              className='h-56 md:col-span-2'
              onRetry={() => void query.refetch()}
            />
          )}
          {!modelLoading && !query.isError && !hasModelUsage && (
            <div className='text-muted-foreground flex h-40 items-center justify-center text-sm sm:h-56 md:col-span-2'>
              {t('No model usage data')}
            </div>
          )}
          {!modelLoading && !query.isError && hasModelUsage && (
            <div className='space-y-3'>
              {modelRanking.map((item, index) => {
                const percentage =
                  modelUsageTotal > 0 ? (item.value / modelUsageTotal) * 100 : 0
                return (
                  <div key={item.name} className='min-w-0'>
                    <div className='mb-1.5 flex items-start gap-2 text-sm'>
                      <span
                        className='mt-1.5 size-2 shrink-0 rounded-full'
                        style={{
                          backgroundColor:
                            MODEL_COLORS[index % MODEL_COLORS.length],
                        }}
                        aria-hidden='true'
                      />
                      <span className='min-w-0 flex-1 font-mono leading-snug font-medium break-all'>
                        {item.name}
                      </span>
                      <span className='shrink-0 font-mono text-xs tabular-nums'>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className='bg-muted/70 h-1.5 overflow-hidden rounded-full'>
                      <div
                        className='bg-chart-1 h-full rounded-full transition-[width] duration-500'
                        style={{ width: `${Math.max(2, percentage)}%` }}
                      />
                    </div>
                    <div className='text-muted-foreground mt-1 text-right font-mono text-[11px] tabular-nums'>
                      {formatMetricValue(item.value, modelMetric)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
