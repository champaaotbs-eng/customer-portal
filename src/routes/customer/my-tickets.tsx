import { createFileRoute } from '@tanstack/react-router'
import { MyTicketsPage } from '@/components/customer/my-tickets/my-tickets-page'

export const Route = createFileRoute('/customer/my-tickets')({ component: MyTicketsPage })
