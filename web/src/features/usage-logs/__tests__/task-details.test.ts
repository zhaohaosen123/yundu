import assert from 'node:assert/strict'

import { describe, test } from 'vitest'

import { resolveTaskDetailAccess } from '../lib/task-details'
import { buildBaseParams } from '../lib/utils'
import type { TaskLog } from '../types'

const task: TaskLog = {
  id: 1,
  user_id: 7,
  platform: 'document-parser',
  task_id: 'task_public',
  action: 'GENERATE',
  channel_id: 3,
  group: 'default',
  quota: 100,
  submit_time: 1,
  status: 'SUCCESS',
  admin_info: {
    task_plugin: {
      key: 'document-parser',
      name: 'Document Parser',
      version: '1.2.3',
      author: {
        name: 'Community Maintainer',
        url: 'https://plugins.example.com/maintainers/community',
      },
    },
  },
  root_info: {
    task_plugin: {
      key: 'document-parser',
      version: '1.2.3',
      api_version: 1,
      generation: 42,
    },
    upstream_task_id: 'upstream-private',
    node_name: 'node-a',
  },
}

describe('task detail access', () => {
  test('does not expose elevated fields in a self view', () => {
    assert.deepEqual(resolveTaskDetailAccess(task, false, false), {})
  })

  test('gives admins plugin identity without root diagnostics', () => {
    assert.deepEqual(resolveTaskDetailAccess(task, true, false), {
      plugin: task.admin_info?.task_plugin,
    })
  })

  test('adds runtime and upstream diagnostics for root', () => {
    assert.deepEqual(resolveTaskDetailAccess(task, true, true), {
      plugin: task.admin_info?.task_plugin,
      runtime: task.root_info?.task_plugin,
      upstreamTaskId: 'upstream-private',
      nodeName: 'node-a',
    })
  })
})

describe('task history query', () => {
  test('loads all historical tasks when no date range is selected', () => {
    assert.deepEqual(
      buildBaseParams({ page: 1, pageSize: 20, searchParams: {} }),
      {
        p: 1,
        page_size: 20,
        start_timestamp: undefined,
        end_timestamp: undefined,
      }
    )
  })

  test('applies an explicit date range to task queries', () => {
    assert.deepEqual(
      buildBaseParams({
        page: 2,
        pageSize: 20,
        searchParams: {
          startTime: 1_700_000_000_000,
          endTime: 1_700_086_400_000,
        },
      }),
      {
        p: 2,
        page_size: 20,
        start_timestamp: 1_700_000_000,
        end_timestamp: 1_700_086_400,
      }
    )
  })
})
