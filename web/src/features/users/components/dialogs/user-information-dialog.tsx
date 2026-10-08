import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { formatQuotaWithCurrency } from '@/lib/currency'
import { useSystemConfigStore } from '@/stores/system-config-store'

import { USER_ROLES, USER_STATUSES, isUserDeleted } from '../../constants'
import type { User } from '../../types'

interface UserInformationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

export function UserInformationDialog(props: UserInformationDialogProps) {
  const { t } = useTranslation()
  useSystemConfigStore((state) => state.config.currency)

  const status = isUserDeleted(props.user)
    ? t('Deleted')
    : t(
        USER_STATUSES[props.user.status as keyof typeof USER_STATUSES]
          ?.labelKey ?? 'Status'
      )
  const role = USER_ROLES[props.user.role as keyof typeof USER_ROLES]
  const fields = [
    [t('ID'), String(props.user.id)],
    [t('Username'), props.user.username],
    [t('Display Name'), props.user.display_name || '—'],
    [t('Email'), props.user.email || '—'],
    [t('Status'), status],
    [t('Role'), role ? t(role.labelKey) : String(props.user.role)],
    [t('User Group'), props.user.group],
    [t('Available Balance'), formatQuotaWithCurrency(props.user.quota)],
    [t('Total Used'), formatQuotaWithCurrency(props.user.used_quota)],
    [
      t('Total Tokens'),
      props.user.total_tokens === undefined
        ? '—'
        : props.user.total_tokens.toLocaleString(),
    ],
    [t('Requests'), props.user.request_count.toLocaleString()],
    [
      t('Created'),
      props.user.created_at
        ? new Date(props.user.created_at * 1000).toLocaleString()
        : '—',
    ],
    [
      t('Last Login'),
      props.user.last_login_at
        ? new Date(props.user.last_login_at * 1000).toLocaleString()
        : '—',
    ],
  ]

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('User Information')}
      description={props.user.username}
    >
      <dl className='divide-border divide-y text-sm'>
        {fields.map(([label, value]) => (
          <div
            key={label}
            className='grid grid-cols-[minmax(7rem,35%)_1fr] gap-3 py-2.5'
          >
            <dt className='text-muted-foreground'>{label}</dt>
            <dd className='min-w-0 text-right font-medium break-words tabular-nums'>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Dialog>
  )
}
