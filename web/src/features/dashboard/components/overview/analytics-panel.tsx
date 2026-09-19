/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
*/
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Activity, ArrowRight, Coins, Hash, Timer } from 'lucide-react'
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
  const buckets = new Map<string, number>()
  for (const item of data) {
    const date = new Date(getTimestamp(Number(item.created_at) || 0))
    const label = Number.isNaN(date.getTime())
      ? '-'
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    buckets.set(label, (buckets.get(label) ?? 0) + getMetricValue(item, metric))
  }
  return Array.from(buckets, ([date, value]) => ({ date, value }))
}

export function AnalyticsPanel() {
  const { t } = useTranslation()
  const [metric, setMetric] = useState<Metric>('tokens')
  const range = useMemo(() => computeTimeRange(14), [])
  const query = useQuery({
    queryKey: ['dashboard', 'overview', 'analytics', range.start_timestamp, range.end_timestamp],
    queryFn: async () =>
      requireServerSuccess(
        await getUserQuotaDates({
          start_timestamp: range.start_timestamp,
          end_timestamp: range.end_timestamp,
          default_time: 'day',
        })
      ),
    staleTime: 60 * 1000,
    refetchInterval: DASHBOARD_REFRESH_INTERVAL_MS,
  })
  const data = query.data?.data ?? EMPTY_DATA
  const trend = useMemo(() => buildTrend(data, metric), [data, metric])
  const recent = useMemo(
    () => [...data].sort((a, b) => Number(b.created_at) - Number(a.created_at)).slice(0, 6),
    [data]
  )

  return (
    <div className='grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]'>
      <Card className='min-w-0'>
        <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-3 border-b pb-4'>
          <div>
            <CardTitle>{t('Usage trends')}</CardTitle>
            <p className='text-muted-foreground mt-1 text-xs'>{t('Last 14 days')}</p>
          </div>
          <div className='flex items-center gap-1 rounded-lg bg-muted p-1' role='tablist' aria-label={t('Usage metric')}>
            {METRICS.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.key}
                  type='button'
                  variant={metric === item.key ? 'secondary' : 'ghost'}
                  size='sm'
                  className={cn('h-7 gap-1.5 px-2 text-xs', metric === item.key && 'shadow-sm')}
                  onClick={() => setMetric(item.key)}
                  role='tab'
                  aria-selected={metric === item.key}
                >
                  <Icon className='size-3.5' aria-hidden='true' />
                  <span className='hidden sm:inline'>{t(item.label)}</span>
                </Button>
              )
            })}
          </div>
        </CardHeader>
        <CardContent className='h-64 pt-5'>
          {query.isPending && (
            <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>{t('Loading')}</div>
          )}
          {!query.isPending && trend.length === 0 && (
            <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>{t('No usage data')}</div>
          )}
          {!query.isPending && trend.length > 0 && (
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke='var(--border)' strokeDasharray='3 3' vertical={false} />
                <XAxis dataKey='date' axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={42} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 12 }} formatter={(value: unknown) => [formatMetricValue(value, metric), t(METRICS.find((item) => item.key === metric)?.label ?? '')]} />
                <Line type='monotone' dataKey='value' stroke='var(--chart-1)' strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className='min-w-0'>
        <CardHeader className='flex flex-row items-center justify-between border-b pb-4'>
          <div>
            <CardTitle>{t('Recent requests')}</CardTitle>
            <p className='text-muted-foreground mt-1 text-xs'>{t('Latest request activity')}</p>
          </div>
          <Button variant='ghost' size='icon' className='size-8' render={<Link to='/usage-logs/$section' params={{ section: 'common' }} />} aria-label={t('View all requests')} title={t('View all requests')}>
            <ArrowRight className='size-4' />
          </Button>
        </CardHeader>
        <CardContent className='p-0'>
          {recent.length === 0 ? (
            <div className='text-muted-foreground p-5 text-sm'>{t('No recent requests')}</div>
          ) : (
            <div className='divide-y'>
              {recent.map((item, index) => (
                <div key={`${item.created_at}-${item.model_name ?? index}`} className='flex items-center justify-between gap-3 px-4 py-3'>
                  <div className='min-w-0'>
                    <div className='truncate text-sm font-medium'>{item.model_name || t('Unknown model')}</div>
                    <div className='text-muted-foreground mt-1 flex items-center gap-1 text-xs'><Timer className='size-3' aria-hidden='true' />{new Date(getTimestamp(Number(item.created_at))).toLocaleString()}</div>
                  </div>
                  <div className='shrink-0 text-right font-mono text-xs tabular-nums'>
                    <div>{formatNumber(Number(item.token_used) || 0)} {t('tokens')}</div>
                    <div className='text-muted-foreground mt-1'>{formatNumber(Number(item.count) || 0)} {t('requests')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
