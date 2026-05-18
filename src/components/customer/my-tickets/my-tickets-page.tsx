import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Ticket, Clock, XCircle, MapPin, ArrowRight, Search, QrCode, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { listMyBookings, cancelBooking, getBookingPayment } from '@/services/bookings.api'
import { generateVietQrDataUrl } from '@/services/vietqr.api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatDateTimeFull, formatVnd, formatTime } from '@/utils/format'
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
const BOOKING_CANCEL_CUTOFF_HOURS = 3

interface ApiBooking {
    bookingId?: string
    id?: string
    bookingCode: string
    tripId: string
    trip?: {
        tripId?: string
    }
    tripInfo?: {
        fromLocationName?: string
        toLocationName?: string
        departureTime?: string
        arrivalTime?: string
        busCompanyName?: string
        pickupStop?: {
            tripStopId: string
            locationName?: string
            locationAddress?: string
            pickupTime?: string
            dropoffTime?: string
        }
        dropoffStop?: {
            tripStopId: string
            locationName?: string
            locationAddress?: string
            pickupTime?: string
            dropoffTime?: string
        }
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
        from: b.tripInfo?.fromLocationName ?? '—',
        to: b.tripInfo?.toLocationName ?? '—',
    }
}

function getStopTime(stop?: { pickupTime?: string; dropoffTime?: string }): string | null {
    const value = stop?.pickupTime ?? stop?.dropoffTime
    return value ? formatTime(value) : null
}

function getCancelDisabledReason(booking: ApiBooking): 'booking_status_not_cancellable' | 'booking_cancel_cutoff_passed' | null {
    const statusKey = booking.status.toLowerCase()
    const cancellableStatuses = new Set(['pending_payment', 'confirmed', 'reserved'])
    if (!cancellableStatuses.has(statusKey)) {
        return 'booking_status_not_cancellable'
    }

    const departureTime = booking.tripInfo?.departureTime ? new Date(booking.tripInfo.departureTime) : null
    if (!departureTime || Number.isNaN(departureTime.getTime())) {
        return null
    }

    const cutoffTime = departureTime.getTime() - BOOKING_CANCEL_CUTOFF_HOURS * 60 * 60 * 1000
    if (Date.now() >= cutoffTime) {
        return 'booking_cancel_cutoff_passed'
    }

    return null
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
    const [showDetails, setShowDetails] = useState(false)
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const [qrError, setQrError] = useState<string | null>(null)
    const bookingId = getBookingId(booking)
    const paymentQuery = useQuery({
        queryKey: ['customer-booking-payment', bookingId],
        queryFn: () => getBookingPayment(bookingId),
        enabled: showDetails && !!bookingId,
        staleTime: 30_000,
    })

    const statusKey = booking.status.toLowerCase()
    const borderClass = STATUS_BORDER[statusKey] ?? 'border-l-muted'
    const { from, to } = getRoute(booking)
    const seatCodes = getSeatCodes(booking)
    const cancelDisabledReason = getCancelDisabledReason(booking)
    const canCancel = cancelDisabledReason === null
    const isPendingOnlinePayment = statusKey === 'pending_payment' && booking.paymentMethod?.toUpperCase() === 'ONLINE'
    const pickupStop = booking.tripInfo?.pickupStop
    const dropoffStop = booking.tripInfo?.dropoffStop
    const hasTripDetails = Boolean(pickupStop || dropoffStop || booking.tripInfo?.departureTime || booking.tripInfo?.arrivalTime)
    const vietQrConfig = useMemo(() => ({
        bankBin: String(import.meta.env.VITE_PAYMENT_BANK_BIN ?? '').trim(),
        accountNumber: String(import.meta.env.VITE_PAYMENT_ACCOUNT ?? '').trim(),
        accountName: String(import.meta.env.VITE_PAYMENT_ACCOUNT_NAME ?? 'NO NAME').trim(),
    }), [])

    useEffect(() => {
        if (!showQr || !isPendingOnlinePayment) {
            setQrDataUrl(null)
            setQrError(null)
            return
        }

        if (!vietQrConfig.bankBin || !vietQrConfig.accountNumber) {
            setQrDataUrl(null)
            setQrError(t('payment_qr_config_missing', { defaultValue: 'Payment QR config missing.' }))
            return
        }

        const amount = Math.round(Number(booking.totalAmount))
        if (!Number.isFinite(amount) || amount <= 0) {
            setQrDataUrl(null)
            setQrError(t('payment_qr_invalid_amount', { defaultValue: 'Invalid payment amount.' }))
            return
        }

        const controller = new AbortController()
        setQrDataUrl(null)
        setQrError(null)
        generateVietQrDataUrl({
            accountNo: vietQrConfig.accountNumber,
            accountName: vietQrConfig.accountName || 'NO NAME',
            acqId: vietQrConfig.bankBin,
            amount,
            addInfo: booking.bookingCode,
            signal: controller.signal,
        })
            .then((value) => {
                setQrDataUrl(value)
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return
                console.error('Failed to generate VietQR code for ticket payment', error)
                setQrDataUrl(null)
                setQrError(t('payment_qr_failed', { defaultValue: 'Unable to generate QR code.' }))
            })

        return () => {
            controller.abort()
        }
    }, [booking.bookingCode, booking.totalAmount, isPendingOnlinePayment, showQr, t, vietQrConfig])

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
                        {booking.tripInfo?.departureTime && (
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 shrink-0" />
                                    {formatTime(booking.tripInfo.departureTime)} · {formatDate(booking.tripInfo.departureTime)}
                                </span>
                                {booking.tripInfo.busCompanyName && (
                                    <>
                                        <span>·</span>
                                        <span>{booking.tripInfo.busCompanyName}</span>
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

            {showDetails && hasTripDetails && (
                <div className="border-t border-border/50 px-5 py-4">
                    <div className="mb-3 grid gap-3 sm:grid-cols-2">
                        {booking.tripInfo?.departureTime && (
                            <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                                <p className="mb-1 font-semibold uppercase tracking-wide text-foreground">{t('departure')}</p>
                                <p className="font-semibold text-foreground">
                                    {formatTime(booking.tripInfo.departureTime)} · {formatDate(booking.tripInfo.departureTime)}
                                </p>
                            </div>
                        )}
                        {booking.tripInfo?.arrivalTime && (
                            <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                                <p className="mb-1 font-semibold uppercase tracking-wide text-foreground">{t('arrival')}</p>
                                <p className="font-semibold text-foreground">
                                    {formatTime(booking.tripInfo.arrivalTime)} · {formatDate(booking.tripInfo.arrivalTime)}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                            <p className="mb-2 font-semibold uppercase tracking-wide text-foreground">{t('pickup')}</p>
                            <div className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <div>
                                    {getStopTime(pickupStop) && <p>{getStopTime(pickupStop)}</p>}
                                    <p className="font-semibold text-foreground">{pickupStop?.locationName ?? from}</p>
                                    {pickupStop?.locationAddress && <p>{pickupStop.locationAddress}</p>}
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                            <p className="mb-2 font-semibold uppercase tracking-wide text-foreground">{t('dropoff')}</p>
                            <div className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                                <div>
                                    {getStopTime(dropoffStop) && <p>{getStopTime(dropoffStop)}</p>}
                                    <p className="font-semibold text-foreground">{dropoffStop?.locationName ?? to}</p>
                                    {dropoffStop?.locationAddress && <p>{dropoffStop.locationAddress}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                    {(paymentQuery.data?.collectedAmount !== undefined && paymentQuery.data?.collectedAmount !== null
                        || paymentQuery.data?.repayAmount !== undefined && paymentQuery.data?.repayAmount !== null
                        || paymentQuery.data?.confirmedAt) && (
                        <div className="mt-3 rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                            <p className="mb-2 font-semibold uppercase tracking-wide text-foreground">{t('payment_info')}</p>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {paymentQuery.data?.collectedAmount !== undefined && paymentQuery.data?.collectedAmount !== null && (
                                    <div>
                                        <p>{t('collected_amount', { defaultValue: 'Collected amount' })}</p>
                                        <p className="font-semibold text-foreground">{formatVnd(Number(paymentQuery.data.collectedAmount))}</p>
                                    </div>
                                )}
                                {paymentQuery.data?.repayAmount !== undefined && paymentQuery.data?.repayAmount !== null && (
                                    <div>
                                        <p>{t('repay_amount', { defaultValue: 'Repay amount' })}</p>
                                        <p className="font-semibold text-foreground">{formatVnd(Number(paymentQuery.data.repayAmount))}</p>
                                    </div>
                                )}
                                {paymentQuery.data?.confirmedAt && (
                                    <div>
                                        <p>{t('confirm_time', { defaultValue: 'Time' })}</p>
                                        <p className="font-semibold text-foreground">{formatDateTimeFull(paymentQuery.data.confirmedAt)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showQr && (
                <div className="flex flex-col items-center gap-3 border-t border-border/50 bg-muted/10 px-5 py-4">
                    <p className="text-xs text-muted-foreground">
                        {isPendingOnlinePayment
                            ? t('payment_qr_help', { defaultValue: 'Scan this QR code to complete payment.' })
                            : t('driver_qr_help', { defaultValue: 'Show this QR code to the driver.' })}
                    </p>
                    {isPendingOnlinePayment ? (
                        qrDataUrl ? (
                            <img
                                src={qrDataUrl}
                                alt={`Payment QR: ${booking.bookingCode}`}
                                className="h-40 w-40 rounded-lg border border-border"
                            />
                        ) : (
                            <div className="flex h-40 w-40 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                                <QrCode className="mb-2 h-6 w-6" />
                                {qrError ?? t('payment_qr_loading', { defaultValue: 'Creating payment QR...' })}
                            </div>
                        )
                    ) : (
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(booking.bookingCode)}&size=160x160&margin=10`}
                            alt={`QR: ${booking.bookingCode}`}
                            className="h-40 w-40 rounded-lg border border-border"
                        />
                    )}
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
                        onClick={() => setShowDetails(v => !v)}
                        className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent"
                        title="View detail"
                    >
                        {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {t('view_detail', { defaultValue: 'View detail' })}
                    </button>
                    <button
                        onClick={() => setShowQr(v => !v)}
                        className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent"
                        title="Show QR code"
                    >
                        <QrCode className="h-3.5 w-3.5" />
                        {isPendingOnlinePayment
                            ? t('pay_now_qr', { defaultValue: 'Pay QR' })
                            : t('ticket_qr', { defaultValue: 'Ticket QR' })}
                    </button>
                    <button
                        type="button"
                        disabled={isCancelling || !canCancel}
                        aria-label={
                            canCancel
                                ? t('cancel_btn')
                                : tCommon(`errors.${cancelDisabledReason}`, { defaultValue: cancelDisabledReason ?? t('cancel_btn') })
                        }
                        title={
                            canCancel
                                ? t('cancel_btn')
                                : tCommon(`errors.${cancelDisabledReason}`, { defaultValue: cancelDisabledReason ?? t('cancel_btn') })
                        }
                        onClick={() => onCancel(getBookingId(booking))}
                        className={cn(
                            'flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/5',
                            (isCancelling || !canCancel) && 'cursor-not-allowed opacity-50',
                        )}
                    >
                        <XCircle className="h-3.5 w-3.5" />
                        {t('cancel_btn')}
                    </button>
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
    const [pendingCancelBookingId, setPendingCancelBookingId] = useState<string | null>(null)
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
    const [feedbackTone, setFeedbackTone] = useState<'success' | 'error'>('success')

    const ticketsQuery = useQuery({
        queryKey: ['my-bookings', user?.id],
        queryFn: () => listMyBookings('', accessToken ?? undefined),
        enabled: !!user,
        select: (data) => readBookings(data),
    })

    const cancelMutation = useMutation({
        mutationFn: (id: string) => cancelBooking(id, accessToken ?? undefined),
        onSuccess: () => {
            setFeedbackTone('success')
            setFeedbackMessage(t('cancel_success'))
            setPendingCancelBookingId(null)
            void qc.invalidateQueries({ queryKey: ['my-bookings', user?.id] })
        },
        onError: (error: any) => {
            setFeedbackTone('error')
            setFeedbackMessage(error?.localizedMessage || error?.message || tCommon('common.error'))
            setPendingCancelBookingId(null)
        },
    })

    function handleCancel(bookingId: string) {
        setFeedbackMessage(null)
        setPendingCancelBookingId(bookingId)
    }

    function confirmCancel() {
        if (!pendingCancelBookingId) return
        cancelMutation.mutate(pendingCancelBookingId)
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

            {feedbackMessage && (
                <div
                    className={cn(
                        'flex items-start gap-2 rounded-xl border px-4 py-3 text-sm',
                        feedbackTone === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-destructive/30 bg-destructive/5 text-destructive',
                    )}
                >
                    {feedbackTone === 'success' ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <span>{feedbackMessage}</span>
                </div>
            )}

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

            {pendingCancelBookingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold text-foreground">{t('cancel_modal_title', { defaultValue: 'Cancel ticket' })}</h2>
                                <p className="text-sm text-muted-foreground">{t('cancel_confirm')}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPendingCancelBookingId(null)}
                                disabled={cancelMutation.isPending}
                            >
                                {tCommon('common.close')}
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmCancel}
                                loading={cancelMutation.isPending}
                            >
                                {t('cancel_btn')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
