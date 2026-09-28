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
import { ArrowUpRight, Megaphone } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { useAnnouncements } from '@/features/dashboard/hooks/use-status-data'
import { getPreviewText } from '@/features/dashboard/lib'
import type { AnnouncementItem } from '@/features/dashboard/types'
import { formatDateTimeObject } from '@/lib/time'

import { AnnouncementDetailModal } from './announcement-detail-dialog'

export function AnnouncementsPanel() {
  const { t } = useTranslation()
  const { items, loading } = useAnnouncements()
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementItem | null>(null)

  if (loading) {
    return (
      <div className='border-warning/20 bg-warning/[0.04] flex min-h-24 items-center gap-4 border-y px-4 py-4 sm:px-5'>
        <Skeleton className='size-10 shrink-0 rounded-full' />
        <div className='flex-1 space-y-2'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-5 w-full max-w-xl' />
        </div>
      </div>
    )
  }

  const featured = [...items].sort((first, second) => {
    const priority = {
      error: 4,
      warning: 3,
      ongoing: 2,
      success: 1,
      default: 0,
    }
    const priorityDelta =
      (priority[second.type ?? 'default'] ?? 0) -
      (priority[first.type ?? 'default'] ?? 0)
    if (priorityDelta !== 0) return priorityDelta
    return (
      new Date(second.publishDate ?? 0).getTime() -
      new Date(first.publishDate ?? 0).getTime()
    )
  })[0]
  if (!featured) return null

  const additionalCount = Math.max(0, items.length - 1)

  return (
    <>
      <section className='border-warning/25 relative overflow-hidden border-y bg-[linear-gradient(100deg,color-mix(in_oklch,var(--warning)_10%,var(--background))_0%,color-mix(in_oklch,var(--warning)_3%,var(--background))_52%,var(--background)_100%)]'>
        <button
          type='button'
          onClick={() => setSelectedAnnouncement(featured)}
          className='focus-visible:ring-ring group flex w-full flex-col gap-3 px-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset sm:flex-row sm:items-center sm:px-5'
          aria-label={`${t('Announcements')}: ${getPreviewText(featured.content)}`}
        >
          <span className='bg-warning/15 text-warning flex size-10 shrink-0 items-center justify-center rounded-full'>
            <Megaphone className='size-5' aria-hidden='true' />
          </span>

          <span className='min-w-0 flex-1'>
            <span className='text-warning flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] uppercase'>
              {t('Announcements')}
              {additionalCount > 0 ? (
                <span className='bg-warning/10 rounded-full px-2 py-0.5 font-mono tracking-normal tabular-nums'>
                  +{additionalCount}
                </span>
              ) : null}
            </span>
            <span className='mt-1 line-clamp-2 block text-sm leading-relaxed font-medium sm:text-base'>
              {getPreviewText(featured.content)}
            </span>
          </span>

          <span className='text-muted-foreground flex shrink-0 items-center gap-3 text-xs'>
            {featured.publishDate ? (
              <time dateTime={featured.publishDate}>
                {formatDateTimeObject(new Date(featured.publishDate))}
              </time>
            ) : null}
            <span className='text-foreground inline-flex items-center gap-1 font-medium'>
              {t('Click for details')}
              <ArrowUpRight
                className='size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                aria-hidden='true'
              />
            </span>
          </span>
        </button>
      </section>

      <AnnouncementDetailModal
        open={selectedAnnouncement !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAnnouncement(null)
        }}
        announcement={selectedAnnouncement}
      />
    </>
  )
}
