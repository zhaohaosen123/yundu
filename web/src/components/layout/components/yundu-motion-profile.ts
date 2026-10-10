/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useRouterState } from '@tanstack/react-router'

export type YunduMotionProfile =
  | 'catalog'
  | 'docs'
  | 'ledger'
  | 'operations'
  | 'public'
  | 'records'
  | 'support'
  | 'workbench'

const PROFILE_MATCHERS: Array<{
  pattern: RegExp
  profile: YunduMotionProfile
}> = [
  { pattern: /(?:chat|playground)/, profile: 'workbench' },
  { pattern: /(?:wallet|billing)/, profile: 'ledger' },
  {
    pattern: /(?:keys|channels|users|subscriptions|redemption-codes)/,
    profile: 'records',
  },
  {
    pattern:
      /(?:dashboard|models|usage-logs|system-settings|system-info|task-plugins)/,
    profile: 'operations',
  },
  { pattern: /(?:docs|privacy-policy|security)/, profile: 'docs' },
  { pattern: /(?:pricing|rankings)/, profile: 'catalog' },
  { pattern: /(?:contact|about)/, profile: 'support' },
]

export function getYunduMotionProfile(pathname: string): YunduMotionProfile {
  return (
    PROFILE_MATCHERS.find(({ pattern }) => pattern.test(pathname))?.profile ??
    'public'
  )
}

export function useYunduMotionProfile(
  explicitProfile?: YunduMotionProfile
): YunduMotionProfile {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  return explicitProfile ?? getYunduMotionProfile(pathname)
}
