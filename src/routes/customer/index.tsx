import { createFileRoute, redirect } from '@tanstack/react-router'
import { APP_ROUTES } from '@/constants/app-routes'

export const Route = createFileRoute('/customer/')({
    beforeLoad: () => {
        throw redirect({ to: APP_ROUTES.CUSTOMER.SEARCH })
    },
    component: () => null,
})
