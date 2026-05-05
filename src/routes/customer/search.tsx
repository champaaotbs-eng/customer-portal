import { createFileRoute } from '@tanstack/react-router'
import { CustomerSearchPage } from '@/components/customer/search/search-page'

export const Route = createFileRoute('/customer/search')({
    validateSearch: (search: Record<string, unknown>) => ({
        from: (search.from as string) ?? '',
        to: (search.to as string) ?? '',
        date: (search.date as string) ?? '',
    }),
    component: CustomerSearchPage,
})
