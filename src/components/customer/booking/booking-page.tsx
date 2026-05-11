import { useState, useMemo } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { CheckCircle2, ChevronLeft, MapPin, Clock, Bus as BusIcon, ArrowRight, User } from 'lucide-react'
import { fetchTripById, type ApiTrip, type ApiSeat } from '@/services/trips.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatTime, formatDate, formatVnd } from '@/utils/format'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface PassengerForm {
    passengerName: string
    passengerEmail: string
    passengerPhone: string
    pickupStopId: string
    dropoffStopId: string
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

export function BookingPage({ tripId }: { tripId: string }) {
    const { t } = useTranslation('translation', { keyPrefix: 'pages.booking' })
    const { t: tCommon } = useTranslation()
    const navigate = useNavigate()

    const [step, setStep] = useState<1 | 2>(1)
    const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
    const [activeFloor, setActiveFloor] = useState<1 | 2>(1)

    const { data: trip, isLoading } = useQuery({
        queryKey: ['public-trip', tripId],
        queryFn: () => fetchTripById(tripId),
        enabled: !!tripId,
        staleTime: 60 * 1000,
    })

    const seats: ApiSeat[] = trip?.seatAvailability ?? []
    const floors = useMemo(() => Array.from(new Set(seats.map(s => s.floor))).sort(), [seats])
    const hasMultipleFloors = floors.length > 1

    const pickupStops = useMemo(
        () => (trip?.tripStops ?? []).filter(s => s.stopType === 'PICKUP' || s.stopType === 'BOTH').sort((a, b) => a.sortOrder - b.sortOrder),
        [trip],
    )
    const dropoffStops = useMemo(
        () => (trip?.tripStops ?? []).filter(s => s.stopType === 'DROPOFF' || s.stopType === 'BOTH').sort((a, b) => a.sortOrder - b.sortOrder),
        [trip],
    )

    const { register, handleSubmit, formState: { errors } } = useForm<PassengerForm>({
        defaultValues: { passengerName: '', passengerEmail: '', passengerPhone: '', pickupStopId: '', dropoffStopId: '', note: '' },
    })

    function toggleSeat(seatId: string) {
        const seat = seats.find(s => s.seatId === seatId)
        if (!seat || !seat.isAvailable) return
        setSelectedSeatIds(prev =>
            prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId],
        )
    }

    function onPassengerSubmit(data: PassengerForm) {
        console.log('passenger info', data)
        if (!data.pickupStopId) { alert(t('pickup_required')); return }
        if (!data.dropoffStopId) { alert(t('dropoff_required')); return }

        navigate({
            to: APP_ROUTES.CUSTOMER.PAYMENT(tripId),
            search: {
                seatIds: selectedSeatIds.join(','),
                pickupStopId: data.pickupStopId,
                dropoffStopId: data.dropoffStopId,
                passengerName: data.passengerName,
                passengerEmail: data.passengerEmail,
                passengerPhone: data.passengerPhone,
                note: data.note,
            },
        })
    }

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

    const selectedSeats = seats.filter(s => selectedSeatIds.includes(s.seatId))
    const totalPrice = selectedSeats.reduce((sum, s) => sum + (trip.basePrice + s.price), 0)
    const stepLabels = [t('step_seat'), t('step_info'), t('step_payment')]

    console.log('check step', { step, selectedSeatIds, activeFloor })

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5">
                <StepIndicator step={step} labels={stepLabels} />
            </div>

            {step === 1 && (
                <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                    <div className="space-y-4">
                        <TripInfoBar trip={trip} />

                        {hasMultipleFloors && (
                            <div className="flex gap-2">
                                {floors.map(fl => (
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

                        <div className="rounded-2xl border border-border bg-card p-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <h2 className="font-semibold">{t('select_seat')}</h2>
                                <SeatLegend t={t} />
                            </div>
                            <div className="mb-5 flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
                                <BusIcon className="h-4 w-4 shrink-0" />
                                <span>{t('front_of_bus', 'Front of bus')}</span>
                            </div>
                            <SeatMap
                                seats={seats.filter(s => !hasMultipleFloors || s.floor === activeFloor)}
                                selectedIds={selectedSeatIds}
                                onToggle={toggleSeat}
                            />
                        </div>
                    </div>

                    <div className="self-start space-y-4 lg:sticky lg:top-24">
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <h3 className="mb-4 font-semibold">{t('order_summary')}</h3>
                            {selectedSeats.length === 0 ? (
                                <p className="text-sm text-muted-foreground">{t('no_seats_selected', 'No seats selected yet')}</p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedSeats.map(s => (
                                            <span
                                                key={s.seatId}
                                                className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                                            >
                                                {s.seatCode}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSeat(s.seatId)}
                                                    className="text-primary/60 hover:text-primary leading-none"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="border-t border-border pt-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{selectedSeats.length} × {t('summary_price_per_seat_unit')}</span>
                                            <span className="font-bold text-primary">{formatVnd(totalPrice)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button
                            className="w-full"
                            size="lg"
                            disabled={selectedSeatIds.length === 0}
                            onClick={() => setStep(2)}
                        >
                            {t('continue_btn', { count: selectedSeatIds.length })}
                        </Button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <form onSubmit={handleSubmit(onPassengerSubmit)}>
                    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                        <div className="space-y-4">
                            <TripInfoBar trip={trip} seatCodes={selectedSeats.map(s => s.seatCode)} />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                                            <MapPin className="h-4 w-4 text-green-600" />
                                        </div>
                                        <h2 className="font-semibold">{t('pickup_title')}</h2>
                                    </div>
                                    <select
                                        {...register('pickupStopId', { required: true })}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">{t('select_pickup')}</option>
                                        {pickupStops.map(p => (
                                            <option key={p.tripStopId} value={p.tripStopId}>
                                                {p.pickupTime ? formatTime(p.pickupTime) : ''}{p.pickupTime ? ' – ' : ''}{p.locationName}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.pickupStopId && (
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
                                        {...register('dropoffStopId', { required: true })}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">{t('select_dropoff')}</option>
                                        {dropoffStops.map(p => (
                                            <option key={p.tripStopId} value={p.tripStopId}>
                                                {p.dropoffTime ? formatTime(p.dropoffTime) : ''}{p.dropoffTime ? ' – ' : ''}{p.locationName}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.dropoffStopId && (
                                        <p className="text-xs text-destructive">{t('dropoff_required')}</p>
                                    )}
                                </div>
                            </div>

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
                                        type="email"
                                        label={t('passenger_email')}
                                        placeholder={t('passenger_email_placeholder')}
                                        {...register('passengerEmail', { required: true })}
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

                        <div className="self-start space-y-4 lg:sticky lg:top-24">
                            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
                                <h3 className="mb-3 font-semibold">{t('order_summary')}</h3>
                                <SummaryRow label={t('summary_route')} value={`${trip.fromLocationName ?? '—'} → ${trip.toLocationName ?? '—'}`} />
                                <SummaryRow label={t('summary_departure')} value={formatDate(trip.departureTime)} />
                                <SummaryRow label={t('summary_seats')} value={selectedSeats.map(s => s.seatCode).join(', ')} />
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
                            {t('continue_btn', { count: selectedSeatIds.length })}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    )
}

function TripInfoBar({ trip, seatCodes }: { trip: ApiTrip; seatCodes?: string[] }) {
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
                            <p className="mt-0.5 text-xs text-muted-foreground">{trip.fromLocationName ?? '—'}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-xl font-bold leading-none">{formatTime(trip.arrivalTime)}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{trip.toLocationName ?? '—'}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(trip.departureTime)}
                    </span>
                    {trip.busCompanyName && (
                        <>
                            <span>·</span>
                            <span>{trip.busCompanyName}</span>
                        </>
                    )}
                    {seatCodes && seatCodes.length > 0 && (
                        <>
                            <span>·</span>
                            <span className="font-medium text-foreground">{seatCodes.join(', ')}</span>
                        </>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xl font-bold text-primary">{formatVnd(trip.basePrice)}</p>
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
    selectedIds,
    onToggle,
}: {
    seats: ApiSeat[]
    selectedIds: string[]
    onToggle: (seatId: string) => void
}) {
    const rowMap = new Map<number, ApiSeat[]>()
    for (const seat of seats) {
        if (!rowMap.has(seat.row)) rowMap.set(seat.row, [])
        rowMap.get(seat.row)!.push(seat)
    }
    const sortedRows = Array.from(rowMap.entries()).sort((a, b) => a[0] - b[0])
    const maxCol = seats.reduce((m, s) => Math.max(m, s.col), 0)
    const hasAisle = maxCol >= 4

    return (
        <div className="space-y-2">
            <div className="flex gap-1.5">
                <div className="w-8" />
                {Array.from({ length: maxCol }, (_, i) => (
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

            {sortedRows.map(([row, rowSeats]) => {
                const sorted = [...rowSeats].sort((a, b) => a.col - b.col)
                return (
                    <div key={row} className="flex items-center gap-1.5">
                        <div className="flex w-8 items-center justify-center text-xs font-medium text-muted-foreground">
                            {String.fromCharCode(64 + row)}
                        </div>
                        {sorted.map(seat => {
                            const isSelected = selectedIds.includes(seat.seatId)
                            const taken = !seat.isAvailable
                            return (
                                <button
                                    key={seat.seatId}
                                    type="button"
                                    disabled={taken}
                                    onClick={() => onToggle(seat.seatId)}
                                    title={seat.seatCode}
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
                )
            })}
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

