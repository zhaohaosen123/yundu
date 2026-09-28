import { createFileRoute, redirect } from '@tanstack/react-router'

import { Dashboard } from '@/features/dashboard'
import {
  DASHBOARD_SECTION_IDS,
  DASHBOARD_DEFAULT_SECTION,
} from '@/features/dashboard/section-registry'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/dashboard/$section')({
  beforeLoad: ({ params }) => {
    const validSections = DASHBOARD_SECTION_IDS as unknown as string[]
    const userRole = useAuthStore.getState().auth.user?.role ?? ROLE.GUEST
    const adminOnlySection = params.section === 'users'
    if (
      !validSections.includes(params.section) ||
      (adminOnlySection && userRole < ROLE.ADMIN)
    ) {
      throw redirect({
        to: '/dashboard/$section',
        params: { section: DASHBOARD_DEFAULT_SECTION },
      })
    }
  },
  component: Dashboard,
})
