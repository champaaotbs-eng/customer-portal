import { useState, useMemo } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { CheckCircle2, ChevronLeft, CreditCard, Wallet, MapPin, Clock, Bus as BusIcon, ArrowRight, User } from 'lucide-react'
import { getTripById } from '@/services/trip.service'
import { getTicketsByTrip, bookTicket } from '@/services/booking.service'
import { useAuthStore } from '@/store/auth.store'
import type { TripWithDetails, Bus, PaymentMethod, PaymentProvider } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatTime, formatDate, formatVnd } from '@/utils/format'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

//  Seat generation helpers 

interface SeatDef {
    code: string
    floor: 1 | 2
    col: number // 1-indexed column within the floor layout
}

function generateSeats(bus: Bus): SeatDef[] {
    const seats: SeatDef[] = []
    if (bus.type === 'sleeper') {
        const perFloor = Math.ceil(bus.totalSeats / 2)
        const rows = Math.ceil(perFloor / 2)
        for (let fl = 1; fl <= 2; fl++) {
            for (let row = 0; row < rows; row++) {
                const letter = String.fromCharCode(65 + row)
                for (let col = 1; col <= 2; col++) {
                    if ((fl - 1) * perFloor + row * 2 + col - 1 < bus.totalSeats) {
                        seats.push({ code: `T${fl}-${letter}${col}`, floor: fl as 1 | 2, col })
                    }
                }
            }
        }
    } else if (bus.type === 'vip') {
        const seatsPerRow = 3
        const rows = Math.ceil(bus.totalSeats / seatsPerRow)
        for (let row = 0; row < rows; row++) {
            const letter = String.fromCharCode(65 + row)
            for (let col = 1; col <= seatsPerRow; col++) {
                if (row * seatsPerRow + col - 1 < bus.totalSeats) {
                    seats.push({ code: `${letter}${col}`, floor: 1, col })
                }
            }
        }
    } else {
        const seatsPerRow = 4
        const rows = Math.ceil(bus.totalSeats / seatsPerRow)
        for (let row = 0; row < rows; row++) {
            const letter = String.fromCharCode(65 + row)
            for (let col = 1; col <= seatsPerRow; col++) {
                if (row * seatsPerRow + col - 1 < bus.totalSeats) {
                    seats.push({ code: `${letter}${col}`, floor: 1, col })
                }
            }
        }
    }
    return seats
}

//  Passenger form 

interface PassengerForm {
    passengerName: string
    passengerPhone: string
    pickupPointId: string
    dropoffPointId: string
    note: string
}

//  Step indicator 

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

//  Main component 

export function BookingPage() {
    const { t } = useTranslation('translation', { keyPrefix: 'pages.booking' })
    const { t: tCommon } = useTranslation()
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const { tripId } = useParams({ strict: false }) as { tripId: string }

    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [selectedSeats, setSelectedSeats] = useState<string[]>([])
    const [activeFloor, setActiveFloor] = useState<1 | 2>(1)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pay_on_board')
    const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('vnpay')
    const [bookedTicketId, setBookedTicketId] = useState<string | null>(null)

    const tripQuery = useQuery({
        queryKey: ['trip', tripId],
        queryFn: () => getTripById(tripId),
        enabled: !!tripId,
    })

    const takenSeatsQuery = useQuery({
        queryKey: ['tickets', 'trip', tripId],
        queryFn: () => getTicketsByTrip(tripId),
        enabled: !!tripId,
    })

    const trip = tripQuery.data as TripWithDetails | null | undefined

    const takenSeats = useMemo(
        () => new Set((takenSeatsQuery.data ?? []).flatMap((tk) => tk.seatNumbers)),
        [takenSeatsQuery.data],
    )

    const seats = useMemo(() => (trip ? generateSeats(trip.bus) : []), [trip])

    const { register, handleSubmit, formState: { errors } } = useForm<PassengerForm>({
        defaultValues: {
            passengerName: user?.name ?? '',
            passengerPhone: user?.phone ?? '',
            pickupPointId: '',
            dropoffPointId: '',
            note: '',
        },
    })

    const bookMutation = useMutation({
        mutationFn: bookTicket,
        onSuccess: (ticket) => {
            setBookedTicketId(ticket.id)
        },
    })

    function toggleSeat(code: string) {
        if (takenSeats.has(code)) return
        setSelectedSeats((prev) =>
            prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code],
        )
    }

    function onPassengerSubmit(data: PassengerForm) {
        if (!data.pickupPointId) {
            alert(t('pickup_required'))
            return
        }
        if (!data.dropoffPointId) {
            alert(t('dropoff_required'))
            return
        }
        setStep(3)
    }

    function onConfirm(data: PassengerForm) {
        if (!trip || !user) return
        const pickup = trip.pickupPoints.find((p) => p.id === data.pickupPointId)
        const dropoff = trip.dropoffPoints.find((p) => p.id === data.dropoffPointId)
        bookMutation.mutate({
            tripId: trip.id,
            customerId: user.id,
            seatNumbers: selectedSeats,
            pricePerSeat: trip.pricePerSeat,
            passengerName: data.passengerName,
            passengerPhone: data.passengerPhone,
            note: data.note || undefined,
            pickupPointId: pickup?.id,
            pickupPointName: pickup?.name,
            dropoffPointId: dropoff?.id,
            dropoffPointName: dropoff?.name,
            paymentMethod,
            paymentProvider: paymentMethod === 'online' ? paymentProvider : undefined,
        })
    }

    // Loading / not found

    if (tripQuery.isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">{tCommon('common.loading')}</p>
                </div>
            </div>
        )
    }
    if (!trip) {
        return (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
                <BusIcon className="h-16 w-16 text-muted-foreground/30" />
                <p className="text-lg font-medium text-muted-foreground">{t('trip_not_found')}</p>
                <Button asChild variant="outline">
                    <Link to={APP_ROUTES.CUSTOMER.SEARCH}>{t('find_another_trip')}</Link>
                </Button>
            </div>
        )
    }

    const stepLabels = [t('step_seat'), t('step_info'), t('step_payment')]
    const totalPrice = selectedSeats.length * trip.pricePerSeat

    // Success screen

    if (bookedTicketId) {
        return (
            <div className="mx-auto max-w-md py-16 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">{t('success_title')}</h2>
                <p className="mb-8 text-muted-foreground">{t('success_message')}</p>

                {/* Boarding pass ticket */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="bg-primary/5 px-6 py-4">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('booking_code')}</p>
                        <p className="mt-1 font-mono text-3xl font-extrabold tracking-widest text-primary">
                            {bookedTicketId.slice(0, 8).toUpperCase()}
                        </p>
                    </div>
                    <div className="relative mx-4">
                        <div className="absolute -left-7 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-muted" />
                        <div className="absolute -right-7 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-muted" />
                        <div className="border-t border-dashed border-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 px-6 py-4 text-left text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground">{t('summary_route')}</p>
                            <p className="mt-0.5 font-semibold">{trip.route.from} → {trip.route.to}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{t('summary_departure')}</p>
                            <p className="mt-0.5 font-semibold">{formatDate(trip.departureTime)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{t('summary_seats')}</p>
                            <p className="mt-0.5 font-semibold">{selectedSeats.join(', ')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{t('summary_total')}</p>
                            <p className="mt-0.5 font-bold text-primary">{formatVnd(totalPrice)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button asChild variant="outline">
                        <Link to={APP_ROUTES.CUSTOMER.SEARCH}>{t('find_another_trip')}</Link>
                    </Button>
                    <Button asChild>
                        <Link to={APP_ROUTES.CUSTOMER.MY_TICKETS}>{t('view_my_tickets')}</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Step indicator */}
            <div className="rounded-2xl border border-border bg-card p-5">
                <StepIndicator step={step} labels={stepLabels} />
            </div>

            {/*  Step 1: Seat selection  */}
            {step === 1 && (
                <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                    <div className="space-y-4">
                        {/* Trip info */}
                        <TripInfoBar trip={trip} />

                        {/* Floor tabs for sleeper */}
                        {trip.bus.type === 'sleeper' && (
                            <div className="flex gap-2">
                                {[1, 2].map((fl) => (
                                    <button
                                        key={fl}
                                        type="button"
                                        onClick={() => setActiveFloor(fl as 1 | 2)}
                                        className={cn(
                                            'rounded-lg border px-5 py-2 text-sm font-medium transition',
                                            activeFloor === fl
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-background hover:bg-accent',
                                        )}
                                    >
                                        {t('floor', { n: fl })}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Seat map */}
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <h2 className="font-semibold">{t('select_seat')}</h2>
                                <SeatLegend t={t} />
                            </div>
                            {/* Bus front indicator */}
                            <div className="mb-5 flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
                                <BusIcon className="h-4 w-4 shrink-0" />
                                <span>Front of bus</span>
                                <span className="ml-auto">{tCommon('busType.' + trip.bus.type)}</span>
                            </div>
                            <SeatMap
                                seats={seats.filter((s) => trip.bus.type !== 'sleeper' || s.floor === activeFloor)}
                                takenSeats={takenSeats}
                                selected={selectedSeats}
                                onToggle={toggleSeat}
                                busType={trip.bus.type}
                            />
                        </div>
                    </div>

                    {/* Sidebar: seat summary */}
                    <div className="self-start space-y-4 lg:sticky lg:top-24">
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <h3 className="mb-4 font-semibold">{t('order_summary')}</h3>
                            {selectedSeats.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No seats selected yet</p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedSeats.map((s) => (
                                            <span
                                                key={s}
                                                className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                                            >
                                                {s}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSeat(s)}
                                                    className="text-primary/60 hover:text-primary leading-none"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="border-t border-border pt-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{selectedSeats.length} × {formatVnd(trip.pricePerSeat)}</span>
                                            <span className="font-bold text-primary">{formatVnd(totalPrice)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button
                            className="w-full"
                            size="lg"
                            disabled={selectedSeats.length === 0}
                            onClick={() => setStep(2)}
                        >
                            {t('continue_btn', { count: selectedSeats.length })}
                        </Button>
                    </div>
                </div>
            )}

            {/*  Step 2: Passenger info + pickup/dropoff  */}
            {step === 2 && (
                <form onSubmit={handleSubmit(onPassengerSubmit)}>
                    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                        <div className="space-y-4">
                            <TripInfoBar trip={trip} seats={selectedSeats} />

                            {/* Pickup & Dropoff side by side */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                                            <MapPin className="h-4 w-4 text-green-600" />
                                        </div>
                                        <h2 className="font-semibold">{t('pickup_title')}</h2>
                                    </div>
                                    <select
                                        {...register('pickupPointId', { required: true })}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">{t('select_pickup')}</option>
                                        {trip.pickupPoints.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {formatTime(p.time)} – {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.pickupPointId && (
                                        <p className="text-xs text-destructive">{t('pickup_required')}</p>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                                            <MapPin className="h-4 w-4 text-red-500" />
                                        </div>
                                        <h2 className="font-semibold">{t('dropoff_title')}</h2>
                                    </div>
                                    <select
                                        {...register('dropoffPointId', { required: true })}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">{t('select_dropoff')}</option>
                                        {trip.dropoffPoints.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {formatTime(p.time)} – {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.dropoffPointId && (
                                        <p className="text-xs text-destructive">{t('dropoff_required')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Passenger info */}
                            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <h2 className="font-semibold">{t('passenger_info')}</h2>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        label={t('passenger_name')}
                                        placeholder={t('passenger_name_placeholder')}
                                        {...register('passengerName', { required: true })}
                                    />
                                    <Input
                                        label={t('passenger_phone')}
                                        placeholder={t('passenger_phone_placeholder')}
                                        {...register('passengerPhone', { required: true })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">{t('passenger_note')}</label>
                                    <textarea
                                        {...register('note')}
                                        placeholder={t('passenger_note_placeholder')}
                                        rows={2}
                                        className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: order summary */}
                        <div className="self-start space-y-4 lg:sticky lg:top-24">
                            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
                                <h3 className="mb-3 font-semibold">{t('order_summary')}</h3>
                                <SummaryRow label={t('summary_route')} value={`${trip.route.from} → ${trip.route.to}`} />
                                <SummaryRow label={t('summary_departure')} value={formatDate(trip.departureTime)} />
                                <SummaryRow label={t('summary_seats')} value={selectedSeats.join(', ')} />
                                <SummaryRow label={t('summary_price_per_seat')} value={formatVnd(trip.pricePerSeat)} />
                                <div className="border-t border-border pt-2">
                                    <SummaryRow label={t('summary_total')} value={formatVnd(totalPrice)} bold />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-between">
                        <Button type="button" variant="outline" onClick={() => setStep(1)}>
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            {t('back_btn')}
                        </Button>
                        <Button type="submit" size="lg">
                            {t('continue_btn', { count: selectedSeats.length })}
                        </Button>
                    </div>
                </form>
            )}

            {/*  Step 3: Payment + confirm  */}
            {step === 3 && (
                <form onSubmit={handleSubmit(onConfirm)}>
                    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                        <div className="space-y-4">
                            <TripInfoBar trip={trip} seats={selectedSeats} />

                            {/* Payment method */}
                            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                        <CreditCard className="h-4 w-4 text-primary" />
                                    </div>
                                    <h2 className="font-semibold">{t('payment_method')}</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('online')}
                                        className={cn(
                                            'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition',
                                            paymentMethod === 'online'
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:bg-accent',
                                        )}
                                    >
                                        <CreditCard className={cn('h-6 w-6 shrink-0', paymentMethod === 'online' ? 'text-primary' : 'text-muted-foreground')} />
                                        <div>
                                            <p className="text-sm font-semibold">{t('payment_online')}</p>
                                            <p className="text-xs text-muted-foreground">VNPay · MoMo · Stripe</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('pay_on_board')}
                                        className={cn(
                                            'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition',
                                            paymentMethod === 'pay_on_board'
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:bg-accent',
                                        )}
                                    >
                                        <Wallet className={cn('h-6 w-6 shrink-0', paymentMethod === 'pay_on_board' ? 'text-primary' : 'text-muted-foreground')} />
                                        <div>
                                            <p className="text-sm font-semibold">{t('payment_on_board')}</p>
                                            <p className="text-xs text-muted-foreground">{t('payment_note_on_board')}</p>
                                        </div>
                                    </button>
                                </div>

                                {paymentMethod === 'online' && (
                                    <div className="space-y-2 pt-1">
                                        <p className="text-sm font-medium">{t('payment_provider_label')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(['vnpay', 'momo', 'stripe'] as PaymentProvider[]).map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setPaymentProvider(p)}
                                                    className={cn(
                                                        'rounded-lg border-2 px-5 py-2 text-sm font-medium transition',
                                                        paymentProvider === p
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-border bg-background hover:bg-accent',
                                                    )}
                                                >
                                                    {tCommon(`paymentProvider.${p}`)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar: order summary + confirm button */}
                        <div className="self-start space-y-4 lg:sticky lg:top-24">
                            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
                                <h3 className="mb-3 font-semibold">{t('order_summary')}</h3>
                                <SummaryRow label={t('summary_route')} value={`${trip.route.from} → ${trip.route.to}`} />
                                <SummaryRow label={t('summary_departure')} value={`${formatDate(trip.departureTime)} ${formatTime(trip.departureTime)}`} />
                                <SummaryRow label={t('summary_company')} value={trip.company.name} />
                                <SummaryRow label={t('summary_seats')} value={selectedSeats.join(', ')} />
                                <SummaryRow label={t('summary_price_per_seat')} value={formatVnd(trip.pricePerSeat)} />
                                <div className="border-t border-border pt-2">
                                    <SummaryRow label={t('summary_total')} value={formatVnd(totalPrice)} bold />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" size="lg" loading={bookMutation.isPending}>
                                {t('confirm_btn')} · {formatVnd(totalPrice)}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button type="button" variant="outline" onClick={() => setStep(2)}>
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            {t('back_btn')}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    )
}

//  Sub-components 

function TripInfoBar({ trip, seats }: { trip: TripWithDetails; seats?: string[] }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/5 to-background">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <BusIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div>
                            <p className="text-xl font-bold leading-none">{formatTime(trip.departureTime)}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{trip.route.from}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-xl font-bold leading-none">{formatTime(trip.arrivalTime)}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{trip.route.to}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(trip.departureTime)}
                    </span>
                    <span>·</span>
                    <span>{trip.company.name}</span>
                    {seats && seats.length > 0 && (
                        <>
                            <span>·</span>
                            <span className="font-medium text-foreground">{seats.join(', ')}</span>
                        </>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xl font-bold text-primary">{formatVnd(trip.pricePerSeat)}</p>
                    <p className="text-xs text-muted-foreground">/ seat</p>
                </div>
            </div>
        </div>
    )
}

function SeatLegend({ t }: { t: ReturnType<typeof useTranslation>['t'] }) {
    return (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
                <span className="inline-block h-5 w-5 rounded border-2 border-border bg-background" />
                {t('seat_legend_available')}
            </span>
            <span className="flex items-center gap-1.5">
                <span className="inline-block h-5 w-5 rounded border-2 border-primary bg-primary text-primary-foreground" />
                {t('seat_legend_selected')}
            </span>
            <span className="flex items-center gap-1.5">
                <span className="inline-block h-5 w-5 rounded bg-muted" />
                {t('seat_legend_booked')}
            </span>
        </div>
    )
}

function SeatMap({
    seats,
    takenSeats,
    selected,
    onToggle,
    busType,
}: {
    seats: SeatDef[]
    takenSeats: Set<string>
    selected: string[]
    onToggle: (code: string) => void
    busType: string
}) {
    const colsPerRow = busType === 'sleeper' ? 2 : busType === 'vip' ? 3 : 4
    const hasAisle = busType === 'seat'

    // Group by row letter
    const rowMap = new Map<string, SeatDef[]>()
    for (const seat of seats) {
        const letter = seat.code.replace(/[^A-Z]/g, '').slice(-1)
        if (!rowMap.has(letter)) rowMap.set(letter, [])
        rowMap.get(letter)!.push(seat)
    }

    return (
        <div className="space-y-2">
            {/* Column headers */}
            <div className={cn('flex gap-1.5', hasAisle && 'gap-0')}>
                <div className="w-8" />
                {Array.from({ length: colsPerRow }, (_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'flex w-10 items-center justify-center text-xs font-medium text-muted-foreground',
                            hasAisle && i === 2 && 'ml-4',
                        )}
                    >
                        {i + 1}
                    </div>
                ))}
            </div>

            {Array.from(rowMap.entries()).map(([letter, rowSeats]) => (
                <div key={letter} className={cn('flex items-center gap-1.5', hasAisle && 'gap-0')}>
                    <div className="flex w-8 items-center justify-center text-xs font-medium text-muted-foreground">{letter}</div>
                    {rowSeats.map((seat) => {
                        const taken = takenSeats.has(seat.code)
                        const isSelected = selected.includes(seat.code)
                        return (
                            <button
                                key={seat.code}
                                type="button"
                                disabled={taken}
                                onClick={() => onToggle(seat.code)}
                                title={seat.code}
                                className={cn(
                                    'flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold transition-all',
                                    hasAisle && seat.col >= 3 && 'ml-4',
                                    taken
                                        ? 'cursor-not-allowed bg-muted text-muted-foreground'
                                        : isSelected
                                            ? 'border-2 border-primary bg-primary text-primary-foreground shadow-sm'
                                            : 'border-2 border-border bg-background hover:border-primary hover:bg-primary/5',
                                )}
                            >
                                {seat.col}
                            </button>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-4 py-0.5">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={cn('text-sm text-right', bold && 'text-base font-bold text-primary')}>{value}</span>
        </div>
    )
}
