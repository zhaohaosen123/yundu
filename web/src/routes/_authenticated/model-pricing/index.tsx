import { createFileRoute, redirect } from '@tanstack/react-router'

import { Pricing } from '@/features/pricing'
import { getModuleAccessForGuard } from '@/lib/nav-modules'

export const Route = createFileRoute('/_authenticated/model-pricing/')({
  beforeLoad: async ({ context }) => {
    const access = await getModuleAccessForGuard(context.queryClient, 'pricing')
    if (!access.enabled) throw redirect({ to: '/dashboard' })
  },
  component: () => <Pricing embedded />,
})
