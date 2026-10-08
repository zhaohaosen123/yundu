import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'

export function ApiBaseUrl(props: { serverAddress: string }) {
  const { t } = useTranslation()
  const base = (props.serverAddress || window.location.origin)
    .replace(/\/+$/, '')
    .replace(/\/v1$/i, '')
  const url = `${base}/v1`

  return (
    <div className='border-border/60 bg-muted/30 flex min-w-0 shrink-0 items-center gap-3 rounded-md border px-3 py-2'>
      <span className='text-muted-foreground shrink-0 text-sm'>
        {t('API Base URL')}
      </span>
      <code className='min-w-0 flex-1 truncate text-sm' title={url}>
        {url}
      </code>
      <CopyButton value={url} tooltip={t('Copy to clipboard')} />
    </div>
  )
}
