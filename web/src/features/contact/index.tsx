/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
*/
import { Download01Icon, QrCode01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { TFunction } from 'i18next'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

type ContactQrCardProps = {
  alt: string
  description: string
  downloadName: string
  imageSrc: string
  title: string
  t: TFunction
}

function ContactQrCard(props: ContactQrCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  return (
    <Card className='w-full'>
      <CardHeader className='gap-2 px-5 pt-2 sm:px-6'>
        <div className='text-primary flex size-9 items-center justify-center rounded-lg bg-primary/10'>
          <HugeiconsIcon icon={QrCode01Icon} strokeWidth={2} />
        </div>
        <CardTitle className='pt-1 text-xl'>{props.t(props.title)}</CardTitle>
        <CardDescription className='leading-6'>
          {props.t(props.description)}
        </CardDescription>
      </CardHeader>

      <CardContent className='px-5 sm:px-6'>
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <button
            type='button'
            className='bg-muted/30 group flex h-80 w-full cursor-zoom-in items-center justify-center rounded-lg p-4 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'
            aria-label={props.t('Open {{name}} QR code', {
              name: props.t(props.title),
            })}
            onClick={() => setIsPreviewOpen(true)}
          >
            <img
              src={props.imageSrc}
              alt={props.t(props.alt)}
              className='max-h-full max-w-full rounded-lg object-contain shadow-sm transition-transform duration-200 group-hover:scale-[1.02]'
            />
          </button>
          <DialogContent className='max-h-[calc(100svh-2rem)] p-3 sm:max-w-3xl'>
            <DialogTitle className='sr-only'>
              {props.t(props.title)}
            </DialogTitle>
            <DialogDescription className='sr-only'>
              {props.t(props.description)}
            </DialogDescription>
            <img
              src={props.imageSrc}
              alt={props.t(props.alt)}
              className='mx-auto max-h-[calc(100svh-3.5rem)] max-w-full rounded-lg object-contain'
            />
          </DialogContent>
        </Dialog>
      </CardContent>

      <CardFooter className='px-5 pb-5 sm:px-6 sm:pb-6'>
        <Button
          variant='outline'
          render={
            <a href={props.imageSrc} download={props.downloadName}>
              <HugeiconsIcon
                icon={Download01Icon}
                strokeWidth={2}
                data-icon='inline-start'
              />
              {props.t('Save QR code')}
            </a>
          }
        />
      </CardFooter>
    </Card>
  )
}

export function Contact() {
  const { t } = useTranslation()

  return (
    <PublicLayout showMainContainer={false}>
      <main className='mx-auto min-h-[calc(100svh-4rem)] w-full max-w-5xl px-4 pb-20 pt-28 sm:px-6'>
        <div className='mx-auto mb-10 max-w-2xl text-center'>
          <p className='text-primary text-xs font-semibold tracking-[0.18em] uppercase'>
            {t('QQ Support')}
          </p>
          <h1 className='mt-3 text-3xl font-semibold sm:text-4xl'>
            {t('Contact Us')}
          </h1>
          <p className='text-muted-foreground mt-4 text-sm leading-6 sm:text-base'>
            {t(
              'For account inquiries, technical support, or service questions, choose a QQ contact method below.'
            )}
          </p>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          <ContactQrCard
            t={t}
            title='Join our QQ group'
            description='Scan the QR code to join the QQ group'
            imageSrc='/qq-group.png'
            alt='QQ group QR code'
            downloadName='qq-group.png'
          />
          <ContactQrCard
            t={t}
            title='Add me on QQ'
            description='Scan the QR code to add me on QQ'
            imageSrc='/qq.png'
            alt='QQ contact QR code'
            downloadName='qq-contact.png'
          />
        </div>
      </main>
      <Footer />
    </PublicLayout>
  )
}
