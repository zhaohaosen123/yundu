import { useIsFetching } from '@tanstack/react-query'
import { useNavigate, getRouteApi } from '@tanstack/react-router'
import type { Table } from '@tanstack/react-table'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useDebounce } from '@/hooks/use-debounce'

import { buildSearchParams } from '../lib/filter'
import type { DrawingLogFilters, LogCategory, TaskLogFilters } from '../types'
import { CompactDateTimeRangePicker } from './compact-date-time-range-picker'
import {
  LogsFilterField,
  LogsFilterInput,
  LogsFilterToolbar,
} from './logs-filter-toolbar'
import { useLogsViewScope } from './usage-logs-provider'

const route = getRouteApi('/_authenticated/usage-logs/$section')

type TaskLikeLogCategory = Extract<LogCategory, 'drawing' | 'task'>
type TaskLogsFilters = DrawingLogFilters | TaskLogFilters

interface TaskLogsFilterBarProps<TData> {
  table: Table<TData>
  logCategory: TaskLikeLogCategory
}

function getFilterValue(
  filters: TaskLogsFilters,
  logCategory: TaskLikeLogCategory
): string {
  if (logCategory === 'drawing') {
    return (filters as DrawingLogFilters).mjId || ''
  }
  return (filters as TaskLogFilters).taskId || ''
}

function setFilterValue(
  filters: TaskLogsFilters,
  logCategory: TaskLikeLogCategory,
  value: string
): TaskLogsFilters {
  if (logCategory === 'drawing') {
    return { ...filters, mjId: value }
  }
  return { ...filters, taskId: value }
}

export function TaskLogsFilterBar<TData>(props: TaskLogsFilterBarProps<TData>) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const searchParams = route.useSearch()
  const { isAdminView: isAdmin } = useLogsViewScope()
  const fetchingLogs = useIsFetching({ queryKey: ['logs'] })

  const sourceKey = JSON.stringify([
    props.logCategory,
    searchParams.startTime,
    searchParams.endTime,
    searchParams.channel,
    searchParams.filter,
  ])
  const urlFilters = useMemo<TaskLogsFilters>(() => {
    const baseFilters = {
      startTime: searchParams.startTime
        ? new Date(searchParams.startTime)
        : undefined,
      endTime: searchParams.endTime
        ? new Date(searchParams.endTime)
        : undefined,
      ...(searchParams.channel
        ? { channel: String(searchParams.channel) }
        : {}),
    }
    return props.logCategory === 'drawing'
      ? {
          ...baseFilters,
          ...(searchParams.filter ? { mjId: searchParams.filter } : {}),
        }
      : {
          ...baseFilters,
          ...(searchParams.filter ? { taskId: searchParams.filter } : {}),
        }
  }, [
    props.logCategory,
    searchParams.startTime,
    searchParams.endTime,
    searchParams.channel,
    searchParams.filter,
  ])
  const [draft, setDraft] = useState({ sourceKey, filters: urlFilters })
  const filters = draft.sourceKey === sourceKey ? draft.filters : urlFilters
  const debouncedDraft = useDebounce(draft, 300)

  useEffect(() => {
    if (
      draft.sourceKey !== sourceKey ||
      debouncedDraft.sourceKey !== sourceKey ||
      JSON.stringify(
        buildSearchParams(debouncedDraft.filters, props.logCategory)
      ) === JSON.stringify(buildSearchParams(urlFilters, props.logCategory))
    ) {
      return
    }
    void navigate({
      to: '/usage-logs/$section',
      params: { section: props.logCategory },
      search: {
        ...buildSearchParams(debouncedDraft.filters, props.logCategory),
        page: 1,
      },
      replace: true,
    })
  }, [
    debouncedDraft,
    draft.sourceKey,
    navigate,
    props.logCategory,
    sourceKey,
    urlFilters,
  ])

  const handleChange = useCallback(
    (field: keyof TaskLogsFilters, value: Date | string | undefined) => {
      setDraft((previous) => ({
        sourceKey,
        filters: {
          ...(previous.sourceKey === sourceKey ? previous.filters : urlFilters),
          [field]: value,
        },
      }))
    },
    [sourceKey, urlFilters]
  )

  const handleReset = useCallback(() => {
    setDraft({ sourceKey, filters: {} })
    void navigate({
      to: '/usage-logs/$section',
      params: { section: props.logCategory },
      search: { page: 1 },
      replace: true,
    })
  }, [navigate, props.logCategory, sourceKey])

  const handleFilterChange = useCallback(
    (value: string) => {
      setDraft((previous) => ({
        sourceKey,
        filters: setFilterValue(
          previous.sourceKey === sourceKey ? previous.filters : urlFilters,
          props.logCategory,
          value
        ),
      }))
    },
    [props.logCategory, sourceKey, urlFilters]
  )

  const filterValue = getFilterValue(filters, props.logCategory)
  const placeholder =
    props.logCategory === 'drawing'
      ? t('Filter by MjProxy task ID')
      : t('Filter by task ID')
  const hasAdditionalFilters =
    !!filterValue ||
    !!filters.channel ||
    !!filters.startTime ||
    !!filters.endTime
  const dateRangeFilter = (
    <LogsFilterField wide>
      <CompactDateTimeRangePicker
        start={filters.startTime}
        end={filters.endTime}
        onChange={({ start, end }) => {
          handleChange('startTime', start)
          handleChange('endTime', end)
        }}
      />
    </LogsFilterField>
  )
  const taskIdFilter = (
    <LogsFilterField>
      <LogsFilterInput
        aria-label={t('Task ID')}
        placeholder={placeholder}
        value={filterValue}
        onChange={(e) => handleFilterChange(e.target.value)}
      />
    </LogsFilterField>
  )
  const channelFilter = isAdmin ? (
    <LogsFilterField>
      <LogsFilterInput
        placeholder={t('Channel ID')}
        value={filters.channel || ''}
        onChange={(e) => handleChange('channel', e.target.value)}
      />
    </LogsFilterField>
  ) : null

  return (
    <LogsFilterToolbar
      table={props.table}
      primaryFilters={
        <>
          {dateRangeFilter}
          {taskIdFilter}
          {channelFilter}
        </>
      }
      mobilePinnedFilters={dateRangeFilter}
      mobileFilters={
        <>
          {taskIdFilter}
          {channelFilter}
        </>
      }
      mobileFilterCount={[filterValue, filters.channel].filter(Boolean).length}
      hasActiveFilters={hasAdditionalFilters}
      autoApply
      searchLoading={fetchingLogs > 0}
      onReset={handleReset}
    />
  )
}
