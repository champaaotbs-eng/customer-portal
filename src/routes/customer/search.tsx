import { createFileRoute } from '@tanstack/react-router'
import { CustomerSearchPage } from '@/components/customer/search/search-page'

export const Route = createFileRoute('/customer/search')({ component: CustomerSearchPage })
