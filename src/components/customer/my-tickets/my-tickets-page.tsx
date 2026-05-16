import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Ticket, Clock, XCircle, MapPin, ArrowRight, Search, QrCode } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { listMyBookings, cancelBooking } from '@/services/bookings.api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatVnd, formatTime } from '@/utils/format'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type StatusVariant = 'default' | 'success' | 'secondary' | 'destructive' | 'warning'

const statusVariant = (s: string): StatusVariant => {
    const map: Record<string, StatusVariant> = {
        pending_payment: 'warning',
        reserved: 'warning',
        confirmed: 'success',
        completed: 'success',
        cancelled: 'destructive',
        expired: 'secondary',
    }
    return map[s.toLowerCase()] ?? 'secondary'
}

const STATUS_BORDER: Record<string, string> = {
    pending_payment: 'border-l-amber-400',
    reserved: 'border-l-amber-400',
    confirmed: 'border-l-primary',
    completed: 'border-l-green-500',
    cancelled: 'border-l-destructive',
    expired: 'border-l-muted-foreground',
}

const STATUS_TABS = ['all', 'confirmed', 'pending_payment', 'completed', 'cancelled'] as const
type StatusTab = typeof STATUS_TABS[number]

interface ApiBooking {
    bookingId?: string
    id?: string
    bookingCode: string
    tripId: string
    trip?: {
        tripId?: string
        fromLocationName?: string
        toLocationName?: string
        departureTime?: string
        arrivalTime?: string
        busCompanyName?: string
        busCompany?: { name?: string }
    }
    totalAmount: number
    paymentMethod?: string
    status: string
    expiresAt?: string | null
    createdAt: string
    seats?: { seatId?: string; seatCode?: string; price?: number; seat?: { seatCode?: string } }[]
    passengerName?: string
    passengerPhone?: string
}

function getBookingId(b: ApiBooking): string {
    return b.bookingId ?? b.id ?? b.bookingCode
}

function getSeatCodes(b: ApiBooking): string {
    if (!b.seats?.length) return '—'
    return b.seats.map(s => s.seatCode ?? s.seat?.seatCode ?? '?').filter(Boolean).join(', ')
}

function getRoute(b: ApiBooking): { from: string; to: string } {
    return {
        from: b.trip?.fromLocationName ?? '—',
        to: b.trip?.toLocationName ?? '—',
    }
}

function BookingCard({
    booking,
    onCancel,
    isCancelling,
}: {
    booking: ApiBooking
    onCancel: (id: string) => void
    isCancelling: boolean
}) {
    const { t } = useTranslation('translation', { keyPrefix: 'pages.my_tickets' })
    const { t: tCommon } = useTranslation()
    const [showQr, setShowQr] = useState(false)

    const statusKey = booking.status.toLowerCase()
    const borderClass = STATUS_BORDER[statusKey] ?? 'border-l-muted'
    const { from, to } = getRoute(booking)
    const seatCodes = getSeatCodes(booking)
    const canCancel = statusKey === 'confirmed' || statusKey === 'reserved' || statusKey === 'pending_payment'

    return (
        <div className={cn('overflow-hidden rounded-2xl border border-border border-l-4 bg-card', borderClass)}>
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Ticket className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-lg font-bold">
                            <span className="truncate">{from}</span>
                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{to}</span>
                        </div>
                        {booking.trip?.departureTime && (
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 shrink-0" />
                                    {formatTime(booking.trip.departureTime)} · {formatDate(booking.trip.departureTime)}
                                </span>
                                {(booking.trip.busCompanyName ?? booking.trip.busCompany?.name) && (
                                    <>
                                        <span>·</span>
                                        <span>{booking.trip.busCompanyName ?? booking.trip.busCompany?.name}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <Badge variant={statusVariant(statusKey)} className="shrink-0">
                    {tCommon(`status.${statusKey}`, { defaultValue: booking.status })}
                </Badge>
            </div>

            <div className="relative mx-5">
                <div className="absolute -left-8 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-muted" />
                <div className="absolute -right-8 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-muted" />
                <div className="border-t border-dashed border-border" />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 sm:grid-cols-4">
                <div>
                    <p className="text-xs text-muted-foreground">{t('seat')}</p>
                    <p className="mt-0.5 font-semibold">{seatCodes}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">{t('payment_method')}</p>
                    <p className="mt-0.5 text-sm font-medium">
                        {booking.paymentMethod
                            ? tCommon(`paymentMethod.${booking.paymentMethod.toLowerCase()}`, { defaultValue: booking.paymentMethod })
                            : '—'}
                    </p>
                </div>
                {booking.passengerName && (
                    <div>
                        <p className="text-xs text-muted-foreground">{t('passenger')}</p>
                        <p className="mt-0.5 flex items-start gap-1 text-sm font-medium">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                            {booking.passengerName}
                        </p>
                    </div>
                )}
            </div>

            {showQr && (
                <div className="flex flex-col items-center gap-3 border-t border-border/50 bg-muted/10 px-5 py-4">
                    <p className="text-xs text-muted-foreground">Show this QR code to the driver</p>
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(booking.bookingCode)}&size=160x160&margin=10`}
                        alt={`QR: ${booking.bookingCode}`}
                        className="h-40 w-40 rounded-lg border border-border"
                    />
                    <p className="font-mono text-sm font-bold tracking-widest text-primary">{booking.bookingCode}</p>
                </div>
            )}

            <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-5 py-3">
                <div className="flex items-center gap-3">
                    <p className="font-mono text-xs text-muted-foreground">#{booking.bookingCode}</p>
                    <span className="text-border">·</span>
                    <p className="text-xs text-muted-foreground">{t('booked_at', { date: formatDate(booking.createdAt) })}</p>
                </div>
                <div className="flex items-center gap-3">
                    <p className="text-base font-bold text-primary">{formatVnd(booking.totalAmount)}</p>
                    <button
                        onClick={() => setShowQr(v => !v)}
                        className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent"
                        title="Show QR code"
                    >
                        <QrCode className="h-3.5 w-3.5" />
                        QR
                    </button>
                    {canCancel && (
                        <button
                            disabled={isCancelling}
                            onClick={() => onCancel(getBookingId(booking))}
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

const readBookings = (payload: unknown): ApiBooking[] => {
    if (!payload || typeof payload !== 'object') return []
    const p = payload as Record<string, unknown>
    if (Array.isArray(p.result)) return p.result as ApiBooking[]
    if (Array.isArray(p.data)) return p.data as ApiBooking[]
    if (p.data && typeof p.data === 'object') {
        const nested = p.data as Record<string, unknown>
        if (Array.isArray(nested.result)) return nested.result as ApiBooking[]
    }
    if (Array.isArray(payload)) return payload as ApiBooking[]
    return []
}

export function MyTicketsPage() {
    const { user, accessToken } = useAuthStore()
    const { t } = useTranslation('translation', { keyPrefix: 'pages.my_tickets' })
    const { t: tCommon } = useTranslation()
    const qc = useQueryClient()
    const [activeTab, setActiveTab] = useState<StatusTab>('all')

    const ticketsQuery = useQuery({
        queryKey: ['my-bookings', user?.id],
        queryFn: () => listMyBookings('', accessToken ?? undefined),
        enabled: !!user,
        select: (data) => readBookings(data),
    })

    const cancelMutation = useMutation({
        mutationFn: (id: string) => cancelBooking(id, accessToken ?? undefined),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['my-bookings', user?.id] })
        },
    })

    function handleCancel(bookingId: string) {
        if (!confirm(t('cancel_confirm'))) return
        cancelMutation.mutate(bookingId)
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

    if (!user) {
        return (
            <div className="flex flex-col items-center gap-5 py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
                    <Ticket className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <div>
                    <p className="text-lg font-semibold">{t('empty')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Please log in to view your tickets</p>
                </div>
                <Button asChild>
                    <Link to={APP_ROUTES.LOGIN}>
                        <Search className="mr-2 h-4 w-4" />
                        {tCommon('nav.login')}
                    </Link>
                </Button>
            </div>
        )
    }

    const allBookings = ticketsQuery.data ?? []

    if (allBookings.length === 0) {
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

    const tabCounts = STATUS_TABS.reduce((acc, tab) => {
        acc[tab] = tab === 'all' ? allBookings.length : allBookings.filter(b => b.status.toLowerCase() === tab).length
        return acc
    }, {} as Record<StatusTab, number>)

    const filtered = activeTab === 'all' ? allBookings : allBookings.filter(b => b.status.toLowerCase() === activeTab)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">{t('title')}</h1>
                <span className="text-sm text-muted-foreground">{allBookings.length} booking(s)</span>
            </div>

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
                            {tab === 'all' ? tCommon('common.all') : tCommon(`status.${tab}`, { defaultValue: tab })}
                            {tabCounts[tab] > 0 && (
                                <span className={cn(
                                    'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                                    activeTab === tab ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                                )}>
                                    {tabCounts[tab]}
                                </span>
                            )}
                        </button>
                    ) : null,
                )}
            </div>

            {filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                    No {activeTab.replace('_', ' ')} bookings
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((booking) => (
                        <BookingCard
                            key={booking.bookingId ?? booking.bookingCode}
                            booking={booking}
                            onCancel={handleCancel}
                            isCancelling={
                                cancelMutation.isPending &&
                                cancelMutation.variables === (booking.bookingId ?? booking.bookingCode)
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
