import type { ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'

import { DataTableColumnHeader } from '@/components/data-table'
import { GroupBadge } from '@/components/group-badge'
import { getLobeIcon } from '@/lib/lobe-icon'

import { FILTER_ALL } from '../constants'
import { getConfiguredGroupRatio } from '../lib/model-helpers'
import type { PricingModel } from '../types'
import { ModelBillingModeBadge } from './model-billing-mode-badge'
import { ModelPriceCell, type ModelPriceCellOptions } from './model-price-cell'

// ----------------------------------------------------------------------------
// Pricing Table Columns
// ----------------------------------------------------------------------------

export type PricingColumnsOptions = ModelPriceCellOptions & {
  groups?: string[]
  groupRatios?: Record<string, number>
}

export function usePricingColumns(
  options: PricingColumnsOptions = {}
): ColumnDef<PricingModel>[] {
  const { t } = useTranslation()

  const comparisonGroups =
    options.selectedGroup && options.selectedGroup !== FILTER_ALL
      ? [options.selectedGroup]
      : (options.groups ?? [])

  return [
    // Model column
    {
      accessorKey: 'model_name',
      meta: { label: t('Model') },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Model')} />
      ),
      cell: ({ row }) => {
        const model = row.original
        const modelIconKey = model.icon || model.vendor_icon
        const modelIcon = modelIconKey ? getLobeIcon(modelIconKey, 14) : null
        const visibleGroups = (model.enable_groups ?? []).filter((group) =>
          options.groups?.length
            ? options.groups.includes(group)
            : group !== 'auto' && group !== ''
        )

        return (
          <div className='flex max-w-full min-w-0 flex-col items-start gap-1'>
            <div className='flex max-w-full min-w-0 items-center gap-2'>
              {modelIcon}
              <span className='truncate font-mono text-sm font-medium'>
                {model.model_name}
              </span>
            </div>
            {visibleGroups.length > 0 && (
              <div className='flex max-w-full flex-wrap gap-1'>
                {visibleGroups.map((group) => (
                  <GroupBadge
                    key={group}
                    group={group}
                    ratio={getConfiguredGroupRatio(
                      options.groupRatios ?? {},
                      group
                    )}
                    ratioLabel={`×${getConfiguredGroupRatio(
                      options.groupRatios ?? {},
                      group
                    )}`}
                    className='text-[10px]'
                    containerClassName='gap-1 text-[10px]'
                  />
                ))}
              </div>
            )}
          </div>
        )
      },
      minSize: 200,
    },

    // Type column
    {
      accessorKey: 'quota_type',
      header: t('Type'),
      cell: ({ row }) => (
        <ModelBillingModeBadge model={row.original} className='-ml-1.5' />
      ),
      size: 110,
      enableSorting: false,
    },

    // Official price before the billing-group multiplier.
    {
      id: 'base_price',
      meta: { label: t('Base Price') },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Base Price')} />
      ),
      cell: ({ row }) => (
        <ModelPriceCell
          model={row.original}
          options={{ ...options, groupRatioMultiplier: 1 }}
        />
      ),
      size: 190,
      enableSorting: false,
    },
    ...comparisonGroups.map<ColumnDef<PricingModel>>((group) => {
      const ratio = getConfiguredGroupRatio(options.groupRatios ?? {}, group)
      return {
        id: `group_price_${group}`,
        header: () => (
          <span className='flex min-w-0 flex-col gap-0.5'>
            <span className='truncate font-medium'>{group}</span>
            <span className='text-muted-foreground text-[10px] font-normal tabular-nums'>
              ×{ratio}
            </span>
          </span>
        ),
        cell: ({ row }) =>
          row.original.enable_groups?.includes(group) ? (
            <ModelPriceCell
              model={row.original}
              options={{ ...options, groupRatioMultiplier: ratio }}
            />
          ) : (
            <span className='text-muted-foreground/50 text-xs'>—</span>
          ),
        size: 190,
        enableSorting: false,
      }
    }),
  ]
}
