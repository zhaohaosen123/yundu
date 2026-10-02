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
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { StatusBadge } from '@/components/status-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { useBillingHistory } from '../hooks/use-billing-history'
import { formatCurrency } from '../lib'
import {
  formatTimestamp,
  getPaymentMethodName,
  getStatusConfig,
} from '../lib/billing'
import { BillingHistoryFilters } from './billing-history-filters'

export function AdminBillingPage() {
  const { t } = useTranslation()
  const {
    records,
    total,
    page,
    pageSize,
    keyword,
    status,
    paymentMethod,
    loading,
    completing,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    handleStatusChange,
    handlePaymentMethodChange,
    handleCompleteOrder,
    refresh,
  } = useBillingHistory({ initialPageSize: 20 })
  const [confirmTradeNo, setConfirmTradeNo] = useState<string | null>(null)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const confirmCompletion = async () => {
    if (!confirmTradeNo) return
    const success = await handleCompleteOrder(confirmTradeNo)
    if (success) setConfirmTradeNo(null)
  }

  return (
    <>
      <SectionPageLayout stackActionsOnMobile>
        <SectionPageLayout.Title>
          {t('Billing History')}
        </SectionPageLayout.Title>
        <SectionPageLayout.Actions>
          <Button
            variant='outline'
            size='sm'
            onClick={() => void refresh()}
            disabled={loading}
          >
            <RefreshCw
              data-icon='inline-start'
              className={loading ? 'animate-spin' : undefined}
            />
            {t('Refresh')}
          </Button>
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <div className='mx-auto flex w-full max-w-[1440px] flex-col gap-3'>
            <Card data-yundu-interactive>
              <CardContent className='flex flex-col gap-3 p-3 sm:p-4 md:flex-row md:flex-wrap md:items-center'>
                <div className='relative min-w-0 flex-1 md:min-w-52'>
                  <Search
                    className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2'
                    aria-hidden='true'
                  />
                  <Input
                    value={keyword}
                    onChange={(event) => handleSearch(event.target.value)}
                    placeholder={t('Search by order number...')}
                    className='pl-9'
                  />
                </div>
                <BillingHistoryFilters
                  status={status}
                  paymentMethod={paymentMethod}
                  onStatusChange={handleStatusChange}
                  onPaymentMethodChange={handlePaymentMethodChange}
                />
                <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <CircleDollarSign
                    className='text-primary size-4'
                    aria-hidden='true'
                  />
                  <span>
                    {t('{{count}} billing records', { count: total })}
                  </span>
                </div>
                <Select
                  items={['20', '50', '100'].map((value) => ({
                    value,
                    label: t('{{count}} / page', { count: value }),
                  }))}
                  value={String(pageSize)}
                  onValueChange={(value) =>
                    value !== null && handlePageSizeChange(Number(value))
                  }
                >
                  <SelectTrigger className='w-full md:w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {[20, 50, 100].map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {t('{{count}} / page', { count: value })}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card data-yundu-interactive className='overflow-hidden'>
              {loading && (
                <div className='flex flex-col gap-2 p-4'>
                  {['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((key) => (
                    <Skeleton key={key} className='h-12 w-full' />
                  ))}
                </div>
              )}
              {!loading && records.length === 0 && (
                <div className='text-muted-foreground flex min-h-64 flex-col items-center justify-center gap-2 p-6 text-center'>
                  <CircleDollarSign className='size-8' aria-hidden='true' />
                  <p className='text-sm font-medium'>
                    {t('No billing records found')}
                  </p>
                  <p className='text-xs'>
                    {keyword || status || paymentMethod
                      ? t('Try adjusting your search')
                      : t('All account payments will appear here')}
                  </p>
                </div>
              )}
              {!loading && records.length > 0 && (
                <>
                  <div className='hidden overflow-x-auto md:block'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('Order')}</TableHead>
                          <TableHead>{t('User')}</TableHead>
                          <TableHead>{t('Payment Method')}</TableHead>
                          <TableHead>{t('Payment')}</TableHead>
                          <TableHead>{t('Created at')}</TableHead>
                          <TableHead>{t('Status')}</TableHead>
                          <TableHead className='w-16 text-right'>
                            {t('Actions')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.map((record) => {
                          const status = getStatusConfig(record.status)
                          return (
                            <TableRow key={record.id}>
                              <TableCell className='max-w-52 truncate font-mono text-xs'>
                                {record.trade_no}
                              </TableCell>
                              <TableCell className='font-mono text-xs'>
                                #{record.user_id}
                              </TableCell>
                              <TableCell>
                                {getPaymentMethodName(record.payment_method, t)}
                              </TableCell>
                              <TableCell className='font-mono font-semibold tabular-nums'>
                                {formatCurrency(record.money)}
                              </TableCell>
                              <TableCell className='text-muted-foreground text-xs'>
                                {formatTimestamp(record.create_time)}
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  label={t(status.label)}
                                  variant={status.variant}
                                  showDot
                                  copyable={false}
                                />
                              </TableCell>
                              <TableCell className='text-right'>
                                {record.status === 'pending' ? (
                                  <Button
                                    variant='ghost'
                                    size='icon-sm'
                                    aria-label={t('Complete Order')}
                                    title={t('Complete Order')}
                                    onClick={() =>
                                      setConfirmTradeNo(record.trade_no)
                                    }
                                  >
                                    <CheckCircle2 />
                                  </Button>
                                ) : null}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className='divide-y md:hidden'>
                    {records.map((record) => {
                      const status = getStatusConfig(record.status)
                      return (
                        <div
                          key={record.id}
                          className='flex flex-col gap-3 p-4'
                        >
                          <div className='flex min-w-0 items-start justify-between gap-3'>
                            <div className='min-w-0'>
                              <div className='truncate font-mono text-xs'>
                                {record.trade_no}
                              </div>
                              <div className='text-muted-foreground mt-1 text-xs'>
                                #{record.user_id} ·{' '}
                                {formatTimestamp(record.create_time)}
                              </div>
                            </div>
                            <StatusBadge
                              label={t(status.label)}
                              variant={status.variant}
                              showDot
                              copyable={false}
                            />
                          </div>
                          <div className='flex items-end justify-between gap-3'>
                            <div>
                              <div className='text-muted-foreground text-xs'>
                                {getPaymentMethodName(record.payment_method, t)}
                              </div>
                              <div className='mt-1 font-mono text-lg font-semibold'>
                                {formatCurrency(record.money)}
                              </div>
                            </div>
                            {record.status === 'pending' ? (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  setConfirmTradeNo(record.trade_no)
                                }
                              >
                                <CheckCircle2 data-icon='inline-start' />
                                {t('Complete Order')}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </Card>

            {!loading && total > 0 ? (
              <div className='flex flex-wrap items-center justify-between gap-3 px-1'>
                <span className='text-muted-foreground text-xs'>
                  {t('Showing')} {(page - 1) * pageSize + 1}-
                  {Math.min(page * pageSize, total)} {t('of')} {total}
                </span>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='icon-sm'
                    aria-label={t('Previous page')}
                    title={t('Previous page')}
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft />
                  </Button>
                  <span className='text-muted-foreground min-w-16 text-center text-sm'>
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant='outline'
                    size='icon-sm'
                    aria-label={t('Next page')}
                    title={t('Next page')}
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <AlertDialog
        open={Boolean(confirmTradeNo)}
        onOpenChange={(open) => !open && setConfirmTradeNo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Complete Order')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'Are you sure you want to manually complete this order? The user will be credited with the corresponding quota.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completing}>
              {t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmCompletion()}
              disabled={completing}
            >
              {completing ? t('Processing...') : t('Confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
