import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'

const contacts = [
  { label: 'QQ', value: '3373384211' },
  { label: 'QQ Group', value: '1105295258' },
  { label: 'WeChat', value: 'z18331960227' },
  {
    label: 'Email',
    value: '3373384211@QQ.com',
    href: 'mailto:3373384211@QQ.com',
  },
] as const

export function SupportContacts() {
  const { t } = useTranslation()

  return (
    <dl className='divide-border divide-y'>
      {contacts.map((contact) => (
        <div
          key={contact.label}
          className='grid grid-cols-[5rem_minmax(0,1fr)_2.25rem] items-center gap-2 py-3 text-sm sm:grid-cols-[6rem_minmax(0,1fr)_2.25rem] sm:gap-3'
        >
          <dt className='text-muted-foreground'>{t(contact.label)}</dt>
          <dd className='min-w-0 font-medium break-all'>
            {'href' in contact ? (
              <a
                className='hover:text-primary underline-offset-4 hover:underline'
                href={contact.href}
              >
                {contact.value}
              </a>
            ) : (
              contact.value
            )}
          </dd>
          <CopyButton
            value={contact.value}
            size='icon'
            className='size-9'
            tooltip={`${t('Copy to clipboard')}: ${t(contact.label)}`}
          />
        </div>
      ))}
    </dl>
  )
}
