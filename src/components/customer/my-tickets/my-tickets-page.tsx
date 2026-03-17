import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Ticket, Clock, XCircle, MapPin, ArrowRight, Search } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { getTicketsByCustomer, cancelTicket } from '@/services/booking.service'
import { getTripById } from '@/services/trip.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatVnd, formatTime } from '@/utils/format'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTranslation } from 'react-i18next'
import type { Ticket as TicketType } from '@/types'
import { cn } from '@/lib/utils'

type StatusVariant = 'default' | 'success' | 'secondary' | 'destructive' | 'warning'

const statusVariant = (s: string): StatusVariant => {
    const map: Record<string, StatusVariant> = {
        pending: 'warning',
        confirmed: 'default',
        completed: 'success',
        cancelled: 'destructive',
    }
    return map[s] ?? 'secondary'
}

const STATUS_BORDER: Record<string, string> = {
    pending: 'border-l-amber-400',
    confirmed: 'border-l-primary',
    completed: 'border-l-green-500',
    cancelled: 'border-l-destructive',
}

const STATUS_TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const
type StatusTab = (typeof STATUS_TABS)[number]

//  Single ticket card (fetches its own trip) 

function TicketCard({
    ticket,
    onCancel,
    isCancelling,
}: {
    ticket: TicketType
    onCancel: (id: string) => void
    isCancelling: boolean
}) {
    const { t } = useTranslation('translation', { keyPrefix: 'pages.my_tickets' })
    const { t: tCommon } = useTranslation()

    const tripQuery = useQuery({
        queryKey: ['trip', ticket.tripId],
        queryFn: () => getTripById(ticket.tripId),
        staleTime: 5 * 60 * 1000,
    })
    const trip = tripQuery.data

    const borderClass = STATUS_BORDER[ticket.status] ?? 'border-l-muted'

    return (
        <div className={cn('overflow-hidden rounded-2xl border border-border border-l-4 bg-card', borderClass)}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Ticket className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        {trip ? (
                            <>
                                <div className="flex items-center gap-2 text-lg font-bold">
                                    <span className="truncate">{trip.route.from}</span>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="truncate">{trip.route.to}</span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 shrink-0" />
                                        {formatTime(trip.departureTime)} · {formatDate(trip.departureTime)}
                                    </span>
                                    <span>·</span>
                                    <span>{trip.company.name}</span>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-1.5">
                                <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                            </div>
                        )}
                    </div>
                </div>
                <Badge variant={statusVariant(ticket.status)} className="shrink-0">
                    {tCommon(`status.${ticket.status}`)}
                </Badge>
            </div>

            {/* Dashed divider (boarding-pass style) */}
            <div className="relative mx-5">
                <div className="absolute -left-8 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-muted" />
                <div className="absolute -right-8 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-muted" />
                <div className="border-t border-dashed border-border" />
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 sm:grid-cols-4">
                <div>
                    <p className="text-xs text-muted-foreground">{t('seat')}</p>
                    <p className="mt-0.5 font-semibold">{ticket.seatNumbers.join(', ')}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">{t('payment_method')}</p>
                    <p className="mt-0.5 text-sm font-medium">
                        {ticket.paymentMethod ? tCommon(`paymentMethod.${ticket.paymentMethod}`) : '—'}
                        {ticket.paymentProvider ? ` · ${tCommon(`paymentProvider.${ticket.paymentProvider}`)}` : ''}
                    </p>
                </div>
                {ticket.pickupPointName && (
                    <div>
                        <p className="text-xs text-muted-foreground">{t('pickup')}</p>
                        <p className="mt-0.5 flex items-start gap-1 text-sm font-medium">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                            {ticket.pickupPointName}
                        </p>
                    </div>
                )}
                {ticket.dropoffPointName && (
                    <div>
                        <p className="text-xs text-muted-foreground">{t('dropoff')}</p>
                        <p className="mt-0.5 flex items-start gap-1 text-sm font-medium">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                            {ticket.dropoffPointName}
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-5 py-3">
                <div className="flex items-center gap-3">
                    <p className="font-mono text-xs text-muted-foreground">#{ticket.id.slice(0, 8).toUpperCase()}</p>
                    <span className="text-border">·</span>
                    <p className="text-xs text-muted-foreground">{t('booked_at', { date: formatDate(ticket.createdAt, true) })}</p>
                </div>
                <div className="flex items-center gap-3">
                    <p className="text-base font-bold text-primary">{formatVnd(ticket.totalPrice)}</p>
                    {(ticket.status === 'confirmed' || ticket.status === 'pending') && (
                        <button
                            disabled={isCancelling}
                            onClick={() => onCancel(ticket.id)}
                            className={cn(
                                'flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/5',
                                isCancelling && 'cursor-not-allowed opacity-50',
                            )}
                        >
                            <XCircle className="h-3.5 w-3.5" />
                            {t('cancel_btn')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

//  Page 

export function MyTicketsPage() {
    const { user } = useAuthStore()
    const { t } = useTranslation('translation', { keyPrefix: 'pages.my_tickets' })
    const { t: tCommon } = useTranslation()
    const qc = useQueryClient()
    const [activeTab, setActiveTab] = useState<StatusTab>('all')

    const ticketsQuery = useQuery({
        queryKey: ['tickets', 'customer', user?.id],
        queryFn: () => getTicketsByCustomer(user!.id),
        enabled: !!user,
    })

    const cancelMutation = useMutation({
        mutationFn: cancelTicket,
        onSuccess: (ok, ticketId) => {
            if (!ok) return
            qc.setQueryData(
                ['tickets', 'customer', user?.id],
                (prev: TicketType[] | undefined) =>
                    prev?.map((tk) =>
                        tk.id === ticketId ? { ...tk, status: 'cancelled' as const } : tk,
                    ),
            )
        },
    })

    function handleCancel(ticketId: string) {
        if (!confirm(t('cancel_confirm'))) return
        cancelMutation.mutate(ticketId)
    }

    if (ticketsQuery.isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">{tCommon('common.loading')}</p>
                </div>
            </div>
        )
    }

    const allTickets = ticketsQuery.data ?? []

    if (allTickets.length === 0) {
        return (
            <div className="flex flex-col items-center gap-5 py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
                    <Ticket className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <div>
                    <p className="text-lg font-semibold">{t('empty')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Book your first trip today</p>
                </div>
                <Button asChild>
                    <Link to={APP_ROUTES.CUSTOMER.SEARCH}>
                        <Search className="mr-2 h-4 w-4" />
                        {t('search_link')}
                    </Link>
                </Button>
            </div>
        )
    }

    const tabCounts = STATUS_TABS.reduce(
        (acc, tab) => {
            acc[tab] = tab === 'all' ? allTickets.length : allTickets.filter((tk) => tk.status === tab).length
            return acc
        },
        {} as Record<StatusTab, number>,
    )

    const filtered = activeTab === 'all' ? allTickets : allTickets.filter((tk) => tk.status === activeTab)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">{t('title')}</h1>
                <span className="text-sm text-muted-foreground">{allTickets.length} ticket(s)</span>
            </div>

            {/* Status tabs */}
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1">
                {STATUS_TABS.map((tab) =>
                    tabCounts[tab] > 0 || tab === 'all' ? (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition',
                                activeTab === tab
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {tab === 'all' ? tCommon('common.all') : tCommon(`status.${tab}`)}
                            {tabCounts[tab] > 0 && (
                                <span
                                    className={cn(
                                        'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                                        activeTab === tab ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                                    )}
                                >
                                    {tabCounts[tab]}
                                </span>
                            )}
                        </button>
                    ) : null,
                )}
            </div>

            {/* Ticket list */}
            {filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                    No {activeTab} tickets
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((ticket) => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            onCancel={handleCancel}
                            isCancelling={cancelMutation.isPending && cancelMutation.variables === ticket.id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
