import { createFileRoute, redirect } from '@tanstack/react-router'
import { CustomerLayout } from '@/components/layouts/CustomerLayout'
import { authStore } from '@/store/auth.store'
import { APP_ROUTES } from '@/constants/app-routes'

export const Route = createFileRoute('/customer')({
    beforeLoad: () => {
        const { user } = authStore.state
        if (!user || user.role !== 'customer') {
            throw redirect({ to: APP_ROUTES.LOGIN })
        }
    },
    component: CustomerLayout,
})
