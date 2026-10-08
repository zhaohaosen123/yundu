import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'

import { SupportContacts } from './support-contacts'

const STORAGE_KEY = 'yundu-contact-support-notice-v1'

function shouldShowNotice(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) !== 'dismissed'
  } catch {
    return true
  }
}

export function ContactSupportDialog() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(shouldShowNotice)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, 'dismissed')
      } catch {
        // The notice can still be closed when storage is unavailable.
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('Contact Us')}
      description={t(
        'Questions about your account, payments, or API requests? Reach us through any of these channels.'
      )}
      contentClassName='sm:max-w-lg'
      footer={
        <Button onClick={() => handleOpenChange(false)}>{t('Close')}</Button>
      }
    >
      <SupportContacts />
    </Dialog>
  )
}
