import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

interface NavItem {
    label: string
    to: string
    icon: LucideIcon
}

interface SidebarProps {
    items: NavItem[]
    title: string
}

export function Sidebar({ items, title }: SidebarProps) {
    return (
        <aside className="flex h-full w-56 flex-shrink-0 flex-col border-r border-border bg-card">
            <div className="flex h-14 items-center border-b border-border px-4">
                <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    {title}
                </span>
            </div>
            <nav className="flex flex-col gap-1 p-2">
                {items.map((item) => {
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground',
                                'hover:bg-accent hover:text-accent-foreground transition-colors',
                                '[&.active]:bg-primary/10 [&.active]:text-primary',
                            )}
                            activeOptions={{ exact: item.to.endsWith('/index') }}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
