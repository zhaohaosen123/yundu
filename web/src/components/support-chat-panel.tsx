import { MessageCircle, Send, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type SupportMessage = { id: number; from: 'user' | 'support'; text: string }

export function SupportChatPanel() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: 1,
      from: 'support',
      text: t('Hi! Leave a message and our team will get back to you.'),
    },
  ])

  const sendMessage = () => {
    const text = draft.trim()
    if (!text) return
    setMessages((current) => [
      ...current,
      { id: Date.now(), from: 'user', text },
    ])
    setDraft('')
  }

  return (
    <>
      <Button
        type='button'
        size='icon'
        className='fixed right-5 bottom-5 z-40 size-11 rounded-full shadow-lg'
        aria-label={t('Open support chat')}
        title={t('Open support chat')}
        onClick={() => setOpen(true)}
      >
        <MessageCircle className='size-5' aria-hidden='true' />
      </Button>
      <aside
        aria-label={t('Support chat')}
        className={cn(
          'bg-background fixed top-0 right-0 z-50 flex h-full w-full max-w-sm flex-col border-l shadow-2xl transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <header className='flex items-center justify-between border-b px-4 py-3'>
          <div>
            <h2 className='text-sm font-semibold'>{t('Support chat')}</h2>
            <p className='text-muted-foreground text-xs'>
              {t('Ask a question about your account or API')}
            </p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={t('Close')}
            title={t('Close')}
            onClick={() => setOpen(false)}
          >
            <X className='size-4' aria-hidden='true' />
          </Button>
        </header>
        <div
          className='flex-1 space-y-3 overflow-y-auto p-4'
          aria-live='polite'
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.from === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                  message.from === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>
        <form
          className='space-y-2 border-t p-4'
          onSubmit={(event) => {
            event.preventDefault()
            sendMessage()
          }}
        >
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('Type your message...')}
            aria-label={t('Message')}
            rows={3}
          />
          <Button type='submit' className='w-full' disabled={!draft.trim()}>
            <Send className='size-4' aria-hidden='true' />
            {t('Send message')}
          </Button>
        </form>
      </aside>
    </>
  )
}
