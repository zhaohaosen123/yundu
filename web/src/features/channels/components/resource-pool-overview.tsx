import { useQuery } from '@tanstack/react-query'
import { Activity, CircleAlert, CircleCheck, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCompactNumber, formatQuota } from '@/lib/format'
import { requireServerSuccess } from '@/lib/server-error-message'
import { cn } from '@/lib/utils'

import { getResourcePoolOverview } from '../api'
import type { ResourcePoolSummary } from '../types'

function PoolStatus({ ready }: { ready: boolean }) {
  const { t } = useTranslation()
  return ready ? (
    <Badge
      variant='outline'
      className='gap-1 border-emerald-500/40 text-emerald-600'
    >
      <CircleCheck className='size-3.5' aria-hidden='true' />
      {t('Ready')}
    </Badge>
  ) : (
    <Badge
      variant='outline'
      className='gap-1 border-amber-500/40 text-amber-600'
    >
      <CircleAlert className='size-3.5' aria-hidden='true' />
      {t('No healthy resources')}
    </Badge>
  )
}

function PoolRow({ pool }: { pool: ResourcePoolSummary }) {
  const { t } = useTranslation()
  return (
    <TableRow>
      <TableCell className='font-medium'>{pool.model}</TableCell>
      <TableCell>
        <PoolStatus ready={pool.ready} />
      </TableCell>
      <TableCell className='text-right'>
        {pool.healthy_resources}/{pool.total_resources}
      </TableCell>
      <TableCell className='text-right'>{pool.total_weight}</TableCell>
      <TableCell className='text-right'>{pool.max_priority}</TableCell>
      <TableCell className='text-right'>
        {pool.average_latency_ms > 0
          ? `${pool.average_latency_ms} ms`
          : t('Not measured')}
      </TableCell>
      <TableCell className='text-right tabular-nums'>
        {formatCompactNumber(pool.request_count)}
      </TableCell>
      <TableCell className='text-right tabular-nums'>
        {formatCompactNumber(pool.requests_5m / 5)} RPM /{' '}
        {formatCompactNumber(pool.tokens_5m / 5)} TPM
      </TableCell>
      <TableCell className='text-right tabular-nums'>
        {formatCompactNumber(pool.token_used)}
      </TableCell>
      <TableCell className='text-right tabular-nums'>
        {formatQuota(pool.quota_used)}
      </TableCell>
      <TableCell className='text-right tabular-nums'>
        {pool.error_count > 0
          ? `${pool.error_count} (${(pool.error_rate * 100).toFixed(1)}%)`
          : '0'}
      </TableCell>
      <TableCell className='text-right tabular-nums'>
        {pool.balance > 0 ? `$${pool.balance.toFixed(2)}` : t('Unavailable')}
      </TableCell>
    </TableRow>
  )
}

function PoolBody(props: {
  isPending: boolean
  isError: boolean
  pools: ResourcePoolSummary[]
}) {
  const { t } = useTranslation()
  if (props.isPending) {
    return (
      <div className='text-muted-foreground px-4 py-8 text-center text-sm'>
        {t('Loading resource pools...')}
      </div>
    )
  }
  if (props.isError) {
    return (
      <div className='text-destructive px-4 py-8 text-center text-sm'>
        {t('Unable to load resource pools')}
      </div>
    )
  }
  if (props.pools.length === 0) {
    return (
      <div className='text-muted-foreground px-4 py-8 text-center text-sm'>
        {t('No model pools configured')}
      </div>
    )
  }
  return (
    <div className='overflow-x-auto'>
      <Table className='min-w-[980px]'>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Model')}</TableHead>
            <TableHead>{t('Status')}</TableHead>
            <TableHead className='text-right'>{t('Healthy / total')}</TableHead>
            <TableHead className='text-right'>{t('Weight')}</TableHead>
            <TableHead className='text-right'>{t('Priority')}</TableHead>
            <TableHead className='text-right'>{t('Avg. latency')}</TableHead>
            <TableHead className='text-right'>{t('Requests')}</TableHead>
            <TableHead className='text-right'>{t('RPM / TPM (5m)')}</TableHead>
            <TableHead className='text-right'>{t('Tokens')}</TableHead>
            <TableHead className='text-right'>{t('Quota used')}</TableHead>
            <TableHead className='text-right'>{t('Errors')}</TableHead>
            <TableHead className='text-right'>
              {t('Upstream balance')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.pools.map((pool) => (
            <PoolRow key={pool.model} pool={pool} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function ResourcePoolOverview() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['resource-pool-overview'],
    queryFn: async () =>
      requireServerSuccess(await getResourcePoolOverview()).data?.items ?? [],
    staleTime: 30_000,
  })
  const pools = query.data ?? []
  const healthy = pools.filter((pool) => pool.ready).length

  return (
    <section
      className='border-border/70 bg-muted/10 mb-4 rounded-lg border'
      aria-labelledby='resource-pool-overview-title'
    >
      <div className='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <Activity
            className='text-primary size-4 shrink-0'
            aria-hidden='true'
          />
          <div className='min-w-0'>
            <h2
              id='resource-pool-overview-title'
              className='truncate text-sm font-semibold'
            >
              {t('Resource pool overview')}
            </h2>
            <p className='text-muted-foreground text-xs'>
              {t('{{healthy}} of {{total}} model pools ready', {
                healthy,
                total: pools.length,
              })}
            </p>
          </div>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCw
            className={cn('size-3.5', query.isFetching && 'animate-spin')}
            aria-hidden='true'
          />
          {t('Refresh')}
        </Button>
      </div>
      <PoolBody
        isPending={query.isPending}
        isError={query.isError}
        pools={pools}
      />
    </section>
  )
}
