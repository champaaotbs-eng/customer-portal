import { Outlet } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { Search, Ticket } from 'lucide-react'
import { APP_ROUTES } from '@/constants/app-routes'
import { cn } from '@/utils/cn'
import { useTranslation } from 'react-i18next'

export function CustomerLayout() {
    const { t } = useTranslation()
    const tabs = [
        { label: t('nav.search'), to: APP_ROUTES.CUSTOMER.SEARCH, icon: Search },
        { label: t('nav.my_tickets'), to: APP_ROUTES.CUSTOMER.MY_TICKETS, icon: Ticket },
    ]
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
            <div className="mx-auto max-w-5xl px-4 py-8">
                {/* Tab navigation */}
                <nav className="mb-8 flex gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <Link
                                key={tab.to}
                                to={tab.to}
                                className={cn(
                                    'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all',
                                    'hover:text-foreground',
                                    '[&.active]:bg-primary [&.active]:text-primary-foreground [&.active]:shadow-sm',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </Link>
                        )
                    })}
                </nav>
                <Outlet />
            </div>
        </div>
    )
}
