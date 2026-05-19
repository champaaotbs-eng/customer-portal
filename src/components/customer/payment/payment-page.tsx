import { useMemo, useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Bus as BusIcon, CreditCard, Wallet, QrCode, CheckCircle2, MapPin, ArrowRight } from 'lucide-react'
import { fetchTripById, type ApiSeat } from '@/services/trips.api'
import { createBooking, checkBookingPaymentStatus, type BookingResult } from '@/services/bookings.api'
import { generateVietQrDataUrl } from '@/services/vietqr.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, formatTime, formatVnd } from '@/utils/format'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { resolveOrCreateWithEmailOtp, sendCustomerEmailOtp } from '@/services/auth/customer-auth.api'
import { isAuthError } from '@/services/auth.service'

type PaymentMethod = 'ONLINE' | 'PAY_ON_BOARD'

type PaymentSearch = {
    seatIds: string
    pickupStopId: string
    dropoffStopId: string
    passengerName: string
    passengerEmail: string
    passengerPhone: string
    note: string
}

function StepIndicator({ step, labels }: { step: number; labels: string[] }) {
    return (
        <div className="flex items-center">
            {labels.map((label, i) => (
                <div key={label} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1.5">
                        <div
                            className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ring-2 transition-all',
                                i + 1 < step
                                    ? 'bg-primary ring-primary text-primary-foreground'
                                    : i + 1 === step
                                        ? 'bg-background ring-primary text-primary'
                                        : 'bg-background ring-muted text-muted-foreground',
                            )}
                        >
                            {i + 1 < step ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                        </div>
                        <span
                            className={cn(
                                'hidden text-xs font-medium sm:block',
                                i + 1 === step ? 'text-primary' : i + 1 < step ? 'text-foreground' : 'text-muted-foreground',
                            )}
                        >
                            {label}
                        </span>
                    </div>
                    {i < labels.length - 1 && (
                        <div className={cn('mx-1 h-0.5 flex-1 rounded-full transition-all', i + 1 < step ? 'bg-primary' : 'bg-muted')} />
                    )}
                </div>
            ))}
        </div>
    )
}

export function PaymentPage({ tripId, search }: { tripId: string; search: PaymentSearch }) {
    const { t } = useTranslation('translation', { keyPrefix: 'pages.booking' })
    const { t: tCommon } = useTranslation()
    const { accessToken } = useAuthStore()

    const seatIdList = useMemo(() => search.seatIds.split(',').map(s => s.trim()).filter(Boolean), [search.seatIds])
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE')
    const [bookedResult, setBookedResult] = useState<BookingResult | null>(null)
    const [paymentConfirmed, setPaymentConfirmed] = useState(false)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [isExpired, setIsExpired] = useState(false)
    const [otp, setOtp] = useState('')
    const [authResolutionError, setAuthResolutionError] = useState<string | null>(null)
    const [authResolutionRequired, setAuthResolutionRequired] = useState<string | null>(null)
    const [otpRequested, setOtpRequested] = useState(false)
    const [retryAfterAuth, setRetryAfterAuth] = useState(false)
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const [qrError, setQrError] = useState<string | null>(null)
    function clearAuthResolutionError() {
        setAuthResolutionError(null)
    }

    const { data: trip, isLoading } = useQuery({
        queryKey: ['public-trip', tripId],
        queryFn: () => fetchTripById(tripId),
        enabled: !!tripId,
        staleTime: 60 * 1000,
    })

    const bookingMutation = useMutation({
        mutationFn: () => createBooking({
            tripId,
            seatIds: seatIdList,
            pickupStopId: search.pickupStopId,
            dropoffStopId: search.dropoffStopId,
            paymentMethod,
            passengerName: search.passengerName || undefined,
            passengerEmail: search.passengerEmail || undefined,
            passengerPhone: search.passengerPhone || undefined,
        }, accessToken ?? undefined),
        onSuccess: (result) => {
            setBookedResult(result)
            setStatusMessage(null)
            setIsExpired(false)
            setPaymentConfirmed(result.status === 'CONFIRMED' || result.status === 'COMPLETED')
            setAuthResolutionRequired(null)
            setAuthResolutionError(null)
        },
        onError: (err: any) => {
            const errorKey = String(err?.response?.data?.message || err?.message || err?.code || '')
            if (/seats_already_booked/i.test(errorKey)) {
                alert(t('error_seats_already_booked'))
            } else if (
                errorKey === 'email_already_registered_login_required' ||
                errorKey === 'booking_email_mismatch_requires_reauth'
            ) {
                setAuthResolutionRequired(errorKey)
                setAuthResolutionError(null)
            } else {
                alert(err?.localizedMessage || err?.message || tCommon('common.error'))
            }
        },
    })

    const resolveEmailAuthMutation = useMutation({
        mutationFn: () => resolveOrCreateWithEmailOtp({
            phone: search.passengerPhone,
            otp: otp.trim(),
            email: search.passengerEmail,
            fullName: search.passengerName || search.passengerEmail,
        }),
        onSuccess: (result) => {
            if (isAuthError(result)) {
                setAuthResolutionError(result.message)
                return
            }

            setAuthResolutionRequired(null)
            setAuthResolutionError(null)
            setRetryAfterAuth(true)
        },
        onError: (err: any) => {
            setAuthResolutionError(err?.localizedMessage || err?.message || tCommon('common.error'))
        },
    })

    const paymentStatusMutation = useMutation({
        mutationFn: (bookingCode: string) => checkBookingPaymentStatus(bookingCode),
        onSuccess: (result) => {
            if (result.isPaid) {
                setPaymentConfirmed(true)
                setStatusMessage(null)
                setBookedResult((current) => current ? { ...current, status: result.bookingStatus, expiresAt: result.expiresAt ?? current.expiresAt } : current)
                return
            }
            if (result.isExpired) {
                setIsExpired(true)
                setStatusMessage(t('payment_expired'))
                return
            }
            setStatusMessage(t('payment_not_received'))
        },
        onError: (err: any) => {
            alert(err?.message || tCommon('common.error'))
        },
    })

    useEffect(() => {
        if (!bookedResult?.expiresAt) return
        if (Date.now() > new Date(bookedResult.expiresAt).getTime()) {
            setIsExpired(true)
        }
    }, [bookedResult?.expiresAt])

    useEffect(() => {
        if (!retryAfterAuth || !accessToken) return
        setRetryAfterAuth(false)
        bookingMutation.mutate()
    }, [retryAfterAuth, accessToken, bookingMutation])

    const seats: ApiSeat[] = trip?.seatAvailability ?? []
    const selectedSeats = seats.filter(s => seatIdList.includes(s.seatId))
    const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0)
    const bookingCode = bookedResult?.bookingCode ?? ''
    const qrBookingCode = bookedResult?.bookingCode ?? ''
    const pickupStop = (trip?.tripStops ?? []).find(s => s.tripStopId === search.pickupStopId)
    const dropoffStop = (trip?.tripStops ?? []).find(s => s.tripStopId === search.dropoffStopId)
    const stepLabels = [t('step_seat'), t('step_info'), t('step_payment')]

    const vietQrConfig = useMemo(() => {
        return {
            bankBin: String(import.meta.env.VITE_PAYMENT_BANK_BIN ?? '').trim(),
            accountNumber: String(import.meta.env.VITE_PAYMENT_ACCOUNT ?? '').trim(),
            accountName: String(import.meta.env.VITE_PAYMENT_ACCOUNT_NAME ?? 'NO NAME').trim(),
        }
    }, [])

    useEffect(() => {
        if (paymentMethod !== 'ONLINE') {
            setQrDataUrl(null)
            setQrError(null)
            return
        }

        if (!qrBookingCode) {
            setQrDataUrl(null)
            setQrError(null)
            return
        }

        if (!vietQrConfig.bankBin || !vietQrConfig.accountNumber) {
            setQrDataUrl(null)
            setQrError(t('payment_qr_config_missing', { defaultValue: 'Payment QR config missing.' }))
            return
        }

        const amount = Number(bookedResult?.totalAmount ?? totalPrice)
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
            amount: Math.round(amount),
            addInfo: qrBookingCode,
            signal: controller.signal,
        })
            .then((qrUrl) => {
                setQrDataUrl(qrUrl)
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return
                setQrDataUrl(null)
                console.error('Failed to generate VietQR code', error)
                setQrError(t('payment_qr_failed', { defaultValue: 'Unable to generate QR code.' }))
            })

        return () => {
            controller.abort()
        }
    }, [bookedResult?.totalAmount, paymentMethod, qrBookingCode, t, totalPrice, vietQrConfig])

    useEffect(() => {
        if (paymentMethod !== 'ONLINE') return
        if (bookedResult || bookingMutation.isPending) return
        bookingMutation.mutate()
    }, [bookedResult, bookingMutation, paymentMethod])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">{tCommon('common.loading')}</p>
                </div>
            </div>
        )
    }

    if (!trip || seatIdList.length === 0 || !search.pickupStopId || !search.dropoffStopId) {
        return (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
                <BusIcon className="h-16 w-16 text-muted-foreground/30" />
                <p className="text-lg font-medium text-muted-foreground">{t('payment_invalid')}</p>
                <Button asChild variant="outline">
                    <Link to={APP_ROUTES.CUSTOMER.BOOKING(tripId)}>{t('back_btn')}</Link>
                </Button>
            </div>
        )
    }

    const canCheckPayment = paymentMethod === 'ONLINE' && !!bookingCode && !paymentConfirmed && !isExpired
    const isPayOnBoard = paymentMethod === 'PAY_ON_BOARD'

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5">
                <StepIndicator step={3} labels={stepLabels} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
                <div className="space-y-5">
                    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('payment_title')}</p>
                                <h2 className="text-lg font-bold">{t('payment_method')}</h2>
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t('payment_safe')}
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                disabled={!!bookedResult}
                                onClick={() => setPaymentMethod('ONLINE')}
                                className={cn(
                                    'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition',
                                    paymentMethod === 'ONLINE'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:bg-accent',
                                    bookedResult && 'cursor-not-allowed opacity-70',
                                )}
                            >
                                <CreditCard className={cn('mt-0.5 h-5 w-5 shrink-0', paymentMethod === 'ONLINE' ? 'text-primary' : 'text-muted-foreground')} />
                                <div>
                                    <p className="text-sm font-semibold">{t('payment_online')}</p>
                                    <p className="text-xs text-muted-foreground">{t('payment_online_desc')}</p>
                                </div>
                            </button>
                            <button
                                type="button"
                                disabled={!!bookedResult}
                                onClick={() => setPaymentMethod('PAY_ON_BOARD')}
                                className={cn(
                                    'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition',
                                    paymentMethod === 'PAY_ON_BOARD'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:bg-accent',
                                    bookedResult && 'cursor-not-allowed opacity-70',
                                )}
                            >
                                <Wallet className={cn('mt-0.5 h-5 w-5 shrink-0', paymentMethod === 'PAY_ON_BOARD' ? 'text-primary' : 'text-muted-foreground')} />
                                <div>
                                    <p className="text-sm font-semibold">{t('payment_on_board')}</p>
                                    <p className="text-xs text-muted-foreground">{t('payment_note_on_board')}</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {paymentMethod === 'ONLINE' && (
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                                        <QrCode className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{t('payment_qr_title')}</p>
                                        <p className="text-xs text-muted-foreground">{t('payment_qr_desc')}</p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
                                    {t('payment_qr_hot')}
                                </span>
                            </div>

                            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px]">
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                                        <p>{t('payment_qr_hint')}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="rounded-lg bg-muted/50 p-2 text-center">
                                            {t('payment_qr_step1')}
                                        </div>
                                        <div className="rounded-lg bg-muted/50 p-2 text-center">
                                            {t('payment_qr_step2')}
                                        </div>
                                        <div className="rounded-lg bg-muted/50 p-2 text-center">
                                            {t('payment_qr_step3')}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center rounded-2xl border border-border bg-background p-3">
                                    {qrBookingCode ? (
                                        qrDataUrl ? (
                                            <img
                                                src={qrDataUrl}
                                                alt={`QR code for payment ${qrBookingCode}`}
                                                className="h-40 w-40 rounded-xl border border-border"
                                            />
                                        ) : (
                                            <div className="flex h-40 w-40 flex-col items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                                                <QrCode className="mb-2 h-6 w-6" />
                                                {qrError ?? t('payment_qr_loading')}
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex h-40 w-40 flex-col items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                                            <QrCode className="mb-2 h-6 w-6" />
                                            {bookingMutation.isPending ? t('payment_qr_loading') : t('payment_qr_wait')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {qrBookingCode && (
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
                                    <span className="font-mono text-xs text-muted-foreground">#{qrBookingCode}</span>
                                    <span className="font-semibold text-primary">{formatVnd(bookedResult?.totalAmount ?? totalPrice)}</span>
                                </div>
                            )}

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-xs text-muted-foreground">
                                    {bookedResult?.expiresAt
                                        ? t('expires_in', { minutes: 15 })
                                        : t('payment_qr_expire')}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        disabled={!canCheckPayment}
                                        loading={paymentStatusMutation.isPending}
                                        onClick={() => bookingCode && paymentStatusMutation.mutate(bookingCode)}
                                    >
                                        {t('payment_qr_paid')}
                                    </Button>
                                </div>
                            </div>

                            {statusMessage && (
                                <div className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                    {statusMessage}
                                </div>
                            )}
                        </div>
                    )}

                    {authResolutionRequired && (
                        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-amber-900">
                                    {authResolutionRequired === 'booking_email_mismatch_requires_reauth'
                                        ? t('reauth_title', { defaultValue: 'Verify the new email to continue' })
                                        : t('login_required_title', { defaultValue: 'Login required for this email address' })}
                                </p>
                                <p className="text-xs text-amber-800">
                                    {t('email_auth_required_desc', {
                                        defaultValue: 'This email address already has an account or does not match the current session. Verify it with OTP to continue booking.',
                                    })}
                                </p>
                            </div>

                            <Input
                                label={t('passenger_email')}
                                value={search.passengerEmail}
                                disabled
                            />

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={async () => {
                                        clearAuthResolutionError()
                                        const result = await sendCustomerEmailOtp(search.passengerEmail)
                                        if (result.message) {
                                            setAuthResolutionError(result.message)
                                            return
                                        }

                                        setOtpRequested(true)
                                        setAuthResolutionError(t('otp_sent', { defaultValue: 'OTP sent to your email.' }))
                                    }}
                                >
                                    {t('send_otp', { defaultValue: 'Send OTP' })}
                                </Button>
                            </div>

                            {otpRequested && (
                                <Input
                                    label={t('otp_label', { defaultValue: 'OTP code' })}
                                    value={otp}
                                    onChange={(e) => {
                                        setOtp(e.target.value)
                                        clearAuthResolutionError()
                                    }}
                                    placeholder={t('otp_placeholder', { defaultValue: 'Enter the 6-digit code' })}
                                />
                            )}

                            {authResolutionError && (
                                <p className="text-xs text-amber-900">{authResolutionError}</p>
                            )}

                            {otpRequested && (
                                <Button
                                    type="button"
                                    loading={resolveEmailAuthMutation.isPending}
                                    onClick={() => {
                                        if (!otp.trim()) {
                                            setAuthResolutionError(t('otp_required', { defaultValue: 'Enter the OTP to continue.' }))
                                            return
                                        }

                                        clearAuthResolutionError()
                                        resolveEmailAuthMutation.mutate()
                                    }}
                                >
                                    {t('verify_otp', { defaultValue: 'Verify OTP' })}
                                </Button>
                            )}
                        </div>
                    )}

                    {paymentMethod === 'PAY_ON_BOARD' && (
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                                    <Wallet className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{t('payment_pay_on_bus_title')}</p>
                                    <p className="text-xs text-muted-foreground">{t('payment_pay_on_bus_desc')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {bookedResult && (paymentConfirmed || isPayOnBoard) && (
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-base font-semibold">{t('payment_success_title')}</p>
                                    <p className="text-xs text-muted-foreground">{t('payment_success_desc')}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Button asChild variant="outline">
                                    <Link to={APP_ROUTES.CUSTOMER.MY_TICKETS}>{t('view_my_tickets')}</Link>
                                </Button>
                                <Button asChild variant="ghost">
                                    <Link to={APP_ROUTES.CUSTOMER.SEARCH}>{t('find_another_trip')}</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="self-start space-y-4 lg:sticky lg:top-24">
                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{t('summary_total')}</p>
                            <p className="text-lg font-bold text-primary">{formatVnd(bookedResult?.totalAmount ?? totalPrice)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('payment_total_note')}</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{t('payment_discount_title')}</p>
                            <button type="button" className="text-xs font-semibold text-primary">{t('payment_discount_cta')}</button>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder={t('payment_discount_placeholder')}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <Button type="button" variant="outline">{t('payment_apply')}</Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('payment_discount_note')}</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                                <BusIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{t('trip_info')}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(trip.departureTime)}</p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">{t('summary_departure')}</p>
                                    <p className="text-sm font-semibold">{formatTime(trip.departureTime)}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">{t('arrival_time', 'Arrival time')}</p>
                                    <p className="text-sm font-semibold">{formatTime(trip.arrivalTime)}</p>
                                </div>
                            </div>
                            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                                <div className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 h-3.5 w-3.5 text-primary" />
                                    <div>
                                        <p className="font-semibold text-foreground">{pickupStop?.locationName ?? trip.fromLocationName ?? '—'}</p>
                                        <p>{pickupStop?.locationAddress ?? ''}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 h-3.5 w-3.5 text-destructive" />
                                    <div>
                                        <p className="font-semibold text-foreground">{dropoffStop?.locationName ?? trip.toLocationName ?? '—'}</p>
                                        <p>{dropoffStop?.locationAddress ?? ''}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t('summary_seats')}</span>
                            <span className="font-semibold text-foreground">{selectedSeats.map(s => s.seatCode).join(', ')}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {isPayOnBoard && !bookedResult && (
                            <Button
                                type="button"
                                className="w-full"
                                size="lg"
                                loading={bookingMutation.isPending}
                                onClick={() => {
                                    setStatusMessage(null)
                                    bookingMutation.mutate()
                                }}
                            >
                                {t('payment_pay_later')} · {formatVnd(totalPrice)}
                            </Button>
                        )}
                        <Button asChild variant="outline" className="w-full">
                            <Link to={APP_ROUTES.CUSTOMER.BOOKING(tripId)}>{t('back_btn')}</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
