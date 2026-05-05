import { createFileRoute } from '@tanstack/react-router'
import { CustomerLayout } from '@/components/layouts/CustomerLayout'

export const Route = createFileRoute('/customer')({
    component: CustomerLayout,
})
