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
import { useTranslation } from 'react-i18next'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { getPaymentMethodName, PAYMENT_METHOD_VALUES } from '../lib/billing'
import type { TopupStatus } from '../types'

const STATUSES: TopupStatus[] = ['success', 'pending', 'failed', 'expired']
const STATUS_LABELS: Record<TopupStatus, string> = {
  success: 'Success',
  pending: 'Pending',
  failed: 'Failed',
  expired: 'Expired',
}

type BillingHistoryFiltersProps = {
  status: TopupStatus | ''
  paymentMethod: string
  onStatusChange: (status: TopupStatus | '') => void
  onPaymentMethodChange: (method: string) => void
}

export function BillingHistoryFilters(props: BillingHistoryFiltersProps) {
  const { t } = useTranslation()
  const statusItems = [
    { value: 'all', label: t('All statuses') },
    ...STATUSES.map((value) => ({
      value,
      label: t(STATUS_LABELS[value]),
    })),
  ]
  const methodItems = [
    { value: 'all', label: t('All payment methods') },
    ...PAYMENT_METHOD_VALUES.map((value) => ({
      value,
      label: getPaymentMethodName(value, t),
    })),
  ]

  return (
    <>
      <Select
        items={statusItems}
        value={props.status || 'all'}
        onValueChange={(value) =>
          value !== null &&
          props.onStatusChange(value === 'all' ? '' : (value as TopupStatus))
        }
      >
        <SelectTrigger className='w-full sm:w-40' aria-label={t('Status')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {statusItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        items={methodItems}
        value={props.paymentMethod || 'all'}
        onValueChange={(value) =>
          value !== null &&
          props.onPaymentMethodChange(value === 'all' ? '' : value)
        }
      >
        <SelectTrigger
          className='w-full sm:w-44'
          aria-label={t('Payment Method')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {methodItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  )
}
