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
import { memo, type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatCurrency } from '@/features/wallet/lib'
import { useMediaQuery } from '@/hooks/use-media-query'
import { toIntlLocale } from '@/i18n/languages'
import { formatCompactNumber, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

import type { AdminOverviewTrendPoint } from '../../types'

const CHART_MARGIN = { top: 8, right: 0, left: 0, bottom: 0 }
const AXIS_TICK = { fontSize: 11, fill: 'var(--muted-foreground)' }
const TOOLTIP_STYLE = {
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--popover)',
  color: 'var(--popover-foreground)',
  fontSize: 12,
}

type TrendSummary = {
  label: string
  value: string
}

type AdminTrendCardProps = {
  title: string
  description: string
  ariaLabel: string
  summaries: TrendSummary[]
  className?: string
  children: ReactNode
}

function AdminTrendCard(props: AdminTrendCardProps) {
  return (
    <Card
      data-yundu-interactive
      className={cn('min-w-0 overflow-hidden', props.className)}
    >
      <CardHeader className='border-b'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='min-w-0'>
            <CardTitle>{props.title}</CardTitle>
            <CardDescription>{props.description}</CardDescription>
          </div>
          <dl className='flex shrink-0 items-start gap-4'>
            {props.summaries.map((summary) => (
              <div key={summary.label} className='text-right'>
                <dt className='text-muted-foreground text-[0.68rem] font-medium'>
                  {summary.label}
                </dt>
                <dd className='mt-0.5 font-mono text-sm font-semibold tabular-nums'>
                  {summary.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </CardHeader>
      <CardContent
        className='h-64 pt-5 sm:h-72'
        role='img'
        aria-label={props.ariaLabel}
      >
        {props.children}
      </CardContent>
    </Card>
  )
}

function sumTrend(
  trend: AdminOverviewTrendPoint[],
  key: 'registrations' | 'revenue' | 'requests' | 'tokens'
): number {
  return trend.reduce((total, point) => total + point[key], 0)
}

function peakTrend(
  trend: AdminOverviewTrendPoint[],
  key: 'registrations' | 'revenue' | 'requests' | 'tokens'
): number {
  return trend.reduce((peak, point) => Math.max(peak, point[key]), 0)
}

type AdminOverviewChartsProps = {
  trend: AdminOverviewTrendPoint[]
  periodDays: number
}

export const AdminOverviewCharts = memo(function AdminOverviewCharts(
  props: AdminOverviewChartsProps
) {
  const { t, i18n } = useTranslation()
  const shouldReduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const intlLocale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        month: 'short',
        day: 'numeric',
      }),
    [intlLocale]
  )
  const summary = useMemo(
    () => ({
      registrations: sumTrend(props.trend, 'registrations'),
      registrationPeak: peakTrend(props.trend, 'registrations'),
      requests: sumTrend(props.trend, 'requests'),
      requestPeak: peakTrend(props.trend, 'requests'),
      tokens: sumTrend(props.trend, 'tokens'),
      revenue: sumTrend(props.trend, 'revenue'),
      revenuePeak: peakTrend(props.trend, 'revenue'),
    }),
    [props.trend]
  )
  const formatDate = (value: string) =>
    dateFormatter.format(new Date(`${value}T00:00:00`))

  return (
    <section className='grid gap-4 xl:grid-cols-2 2xl:grid-cols-3'>
      <AdminTrendCard
        title={t('Registrations')}
        description={`${t('Daily new users across the selected period')} · ${props.periodDays} ${t('days')}`}
        ariaLabel={t('Daily new users across the selected period')}
        summaries={[
          { label: t('Total'), value: formatNumber(summary.registrations) },
          { label: t('Peak'), value: formatNumber(summary.registrationPeak) },
        ]}
      >
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={props.trend} margin={CHART_MARGIN}>
            <CartesianGrid
              stroke='var(--border)'
              strokeDasharray='3 3'
              vertical={false}
            />
            <XAxis
              dataKey='date'
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              minTickGap={24}
              tickFormatter={formatDate}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={48}
            />
            <ChartTooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(label) => formatDate(String(label))}
              formatter={(value) => [
                formatNumber(Number(value ?? 0)),
                t('Registrations'),
              ]}
            />
            <Line
              type='monotone'
              dataKey='registrations'
              name={t('Registrations')}
              stroke='var(--chart-2)'
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={!shouldReduceMotion}
            />
          </LineChart>
        </ResponsiveContainer>
      </AdminTrendCard>

      <AdminTrendCard
        title={t('Platform activity')}
        description={`${t('Requests and token usage across the selected period')} · ${props.periodDays} ${t('days')}`}
        ariaLabel={t('Requests and token usage across the selected period')}
        summaries={[
          { label: t('Tokens'), value: formatCompactNumber(summary.tokens) },
          { label: t('Requests'), value: formatNumber(summary.requests) },
        ]}
      >
        <ResponsiveContainer width='100%' height='100%'>
          <ComposedChart data={props.trend} margin={CHART_MARGIN}>
            <defs>
              <linearGradient id='admin-token-area' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor='var(--chart-1)'
                  stopOpacity={0.3}
                />
                <stop
                  offset='100%'
                  stopColor='var(--chart-1)'
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke='var(--border)'
              strokeDasharray='3 3'
              vertical={false}
            />
            <XAxis
              dataKey='date'
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              minTickGap={24}
              tickFormatter={formatDate}
            />
            <YAxis
              yAxisId='tokens'
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              tickFormatter={(value) => formatCompactNumber(Number(value))}
              width={52}
            />
            <YAxis
              yAxisId='requests'
              orientation='right'
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              tickFormatter={(value) => formatCompactNumber(Number(value))}
              width={44}
            />
            <ChartTooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(label) => formatDate(String(label))}
              formatter={(value, name) => [
                formatNumber(Number(value ?? 0)),
                name === 'tokens' ? t('Tokens') : t('Requests'),
              ]}
            />
            <Area
              yAxisId='tokens'
              type='monotone'
              dataKey='tokens'
              name='tokens'
              stroke='var(--chart-1)'
              strokeWidth={2.5}
              fill='url(#admin-token-area)'
              isAnimationActive={!shouldReduceMotion}
            />
            <Line
              yAxisId='requests'
              type='monotone'
              dataKey='requests'
              name='requests'
              stroke='var(--chart-2)'
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={!shouldReduceMotion}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </AdminTrendCard>

      <AdminTrendCard
        title={t('Revenue')}
        description={`${t('Confirmed top-up revenue across the selected period')} · ${props.periodDays} ${t('days')}`}
        ariaLabel={t('Confirmed top-up revenue across the selected period')}
        className='xl:col-span-2 2xl:col-span-1'
        summaries={[
          { label: t('Total'), value: formatCurrency(summary.revenue) },
          { label: t('Peak'), value: formatCurrency(summary.revenuePeak) },
        ]}
      >
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={props.trend} margin={CHART_MARGIN}>
            <defs>
              <linearGradient
                id='admin-revenue-area'
                x1='0'
                y1='0'
                x2='0'
                y2='1'
              >
                <stop
                  offset='0%'
                  stopColor='var(--chart-4)'
                  stopOpacity={0.34}
                />
                <stop
                  offset='100%'
                  stopColor='var(--chart-4)'
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke='var(--border)'
              strokeDasharray='3 3'
              vertical={false}
            />
            <XAxis
              dataKey='date'
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              minTickGap={24}
              tickFormatter={formatDate}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              tickFormatter={(value) => formatCompactNumber(Number(value))}
              width={52}
            />
            <ChartTooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(label) => formatDate(String(label))}
              formatter={(value) => [
                formatCurrency(Number(value ?? 0)),
                t('Revenue'),
              ]}
            />
            <Area
              type='monotone'
              dataKey='revenue'
              name={t('Revenue')}
              stroke='var(--chart-4)'
              strokeWidth={2.5}
              fill='url(#admin-revenue-area)'
              isAnimationActive={!shouldReduceMotion}
            />
          </AreaChart>
        </ResponsiveContainer>
      </AdminTrendCard>
    </section>
  )
})
