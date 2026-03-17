import { Link } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Search, ArrowLeftRight, SlidersHorizontal, Bus, Clock, MapPin, Users, Filter, X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { searchTrips } from '@/services/trip.service'
import { MOCK_ROUTES } from '@/data/mock'
import type { TripWithDetails, BusType } from '@/types'
import { Button } from '@/components/ui/button'
import { formatTime, formatDuration, formatVnd } from '@/utils/format'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

//  Unique city list from mock routes 

const ALL_CITIES = Array.from(
    new Set(MOCK_ROUTES.flatMap((r) => [r.from, r.to])),
).sort()

//  Types 

interface SearchForm {
    from: string
    to: string
    date: string
    returnDate: string
    passengers: number
    roundTrip: boolean
}

type SortKey = 'price_asc' | 'price_desc' | 'dep_asc' | 'dep_desc'

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night'
const TIME_SLOTS: { key: TimeSlot; hours: [number, number] }[] = [
    { key: 'morning', hours: [5, 12] },
    { key: 'afternoon', hours: [12, 18] },
    { key: 'evening', hours: [18, 24] },
    { key: 'night', hours: [0, 5] },
]

function hourInSlot(iso: string, slot: TimeSlot): boolean {
    const h = new Date(iso).getHours()
    if (slot === 'night') return h >= 0 && h < 5
    const [start, end] = TIME_SLOTS.find((s) => s.key === slot)!.hours
    return h >= start && h < end
}

//  Component 

export function CustomerSearchPage() {
    const { t } = useTranslation('translation', { keyPrefix: 'pages.search' })
    const { t: tCommon } = useTranslation()
    const today = new Date().toISOString().split('T')[0]

    const [results, setResults] = useState<TripWithDetails[] | null>(null)
    const [sortKey, setSortKey] = useState<SortKey>('dep_asc')
    const [timeFilters, setTimeFilters] = useState<TimeSlot[]>([])
    const [typeFilters, setTypeFilters] = useState<BusType[]>([])
    const [companyFilters, setCompanyFilters] = useState<string[]>([])
    const [filterOpen, setFilterOpen] = useState(false)

    const BUS_TYPE_LABEL: Record<BusType, string> = {
        seat: tCommon('busType.standard'),
        sleeper: tCommon('busType.sleeper'),
        vip: tCommon('busType.limousine'),
    }

    const { register, handleSubmit, setValue, watch } = useForm<SearchForm>({
        defaultValues: { from: '', to: '', date: today, returnDate: '', passengers: 1, roundTrip: false },
    })
    const roundTrip = watch('roundTrip')
    const fromVal = watch('from')
    const toVal = watch('to')

    const searchMutation = useMutation({
        mutationFn: searchTrips,
        onSuccess: (trips) => {
            setResults(trips)
            setTimeFilters([])
            setTypeFilters([])
            setCompanyFilters([])
        },
    })

    function swapLocations() {
        const from = fromVal
        const to = toVal
        setValue('from', to)
        setValue('to', from)
    }

    const availableCompanies = useMemo(
        () => Array.from(new Set((results ?? []).map((t) => t.company.name))),
        [results],
    )

    const displayedTrips = useMemo(() => {
        if (!results) return []
        let out = [...results]
        if (timeFilters.length > 0)
            out = out.filter((t) => timeFilters.some((s) => hourInSlot(t.departureTime, s)))
        if (typeFilters.length > 0)
            out = out.filter((t) => typeFilters.includes(t.bus.type as BusType))
        if (companyFilters.length > 0)
            out = out.filter((t) => companyFilters.includes(t.company.name))
        out.sort((a, b) => {
            if (sortKey === 'price_asc') return a.pricePerSeat - b.pricePerSeat
            if (sortKey === 'price_desc') return b.pricePerSeat - a.pricePerSeat
            if (sortKey === 'dep_asc')
                return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
            return new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime()
        })
        return out
    }, [results, timeFilters, typeFilters, companyFilters, sortKey])

    function toggleFilter<T>(arr: T[], setArr: (v: T[]) => void, val: T) {
        setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val])
    }

    const hasActiveFilters = timeFilters.length > 0 || typeFilters.length > 0 || companyFilters.length > 0

    return (
        <div className="space-y-6">
            {/*  Search Form  */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Form header */}
                <div className="border-b border-border bg-primary/5 px-6 py-4">
                    <h1 className="text-xl font-bold">{t('title')}</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t('subtitle')}</p>
                </div>

                <form
                    onSubmit={handleSubmit((data) =>
                        searchMutation.mutate({ ...data, passengers: Number(data.passengers) }),
                    )}
                    className="p-6 space-y-5"
                >
                    {/* Trip type toggle */}
                    <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1 w-fit">
                        {(['one_way', 'round_trip'] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setValue('roundTrip', type === 'round_trip')}
                                className={cn(
                                    'rounded-md px-4 py-1.5 text-sm font-medium transition',
                                    (type === 'round_trip') === roundTrip
                                        ? 'bg-card shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {type === 'one_way' ? t('one_way') : t('round_trip')}
                            </button>
                        ))}
                    </div>

                    {/* From / To row */}
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-1.5">
                            <label className="flex items-center gap-1.5 text-sm font-semibold">
                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                {t('from')}
                            </label>
                            <select
                                {...register('from')}
                                required
                                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">{t('from_placeholder')}</option>
                                {ALL_CITIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={swapLocations}
                            title={t('swap')}
                            className="hidden self-center rounded-xl border border-border bg-background p-2.5 text-muted-foreground transition hover:bg-primary hover:text-primary-foreground hover:border-primary sm:block"
                        >
                            <ArrowLeftRight className="h-4 w-4" />
                        </button>

                        <div className="flex-1 space-y-1.5">
                            <label className="flex items-center gap-1.5 text-sm font-semibold">
                                <MapPin className="h-3.5 w-3.5 text-destructive" />
                                {t('to')}
                            </label>
                            <select
                                {...register('to')}
                                required
                                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">{t('to_placeholder')}</option>
                                {ALL_CITIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date / Passengers row */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-sm font-semibold">
                                <Clock className="h-3.5 w-3.5 text-primary" />
                                {t('date')}
                            </label>
                            <input
                                type="date"
                                min={today}
                                required
                                {...register('date')}
                                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        {roundTrip && (
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-sm font-semibold">
                                    <Clock className="h-3.5 w-3.5 text-primary" />
                                    {t('return_date')}
                                </label>
                                <input
                                    type="date"
                                    min={today}
                                    {...register('returnDate')}
                                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-sm font-semibold">
                                <Users className="h-3.5 w-3.5 text-primary" />
                                {t('passengers')}
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                {...register('passengers', { valueAsNumber: true })}
                                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <div className="text-xs text-muted-foreground">
                            {searchMutation.isError && (
                                <span className="text-destructive">{tCommon('common.error')}</span>
                            )}
                        </div>
                        <Button
                            type="submit"
                            loading={searchMutation.isPending}
                            size="lg"
                            className="min-w-[160px] gap-2"
                        >
                            <Search className="h-4 w-4" />
                            {t('search_btn')}
                        </Button>
                    </div>
                </form>
            </div>

            {/*  Results  */}
            {results !== null && (
                <div className="space-y-4">
                    {/* Results header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-sm">
                        <p className="font-semibold">
                            <span className="text-primary">{displayedTrips.length}</span>
                            <span className="text-muted-foreground ml-1 text-sm">
                                {t('results_count', { count: results.length })}
                            </span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setFilterOpen((o) => !o)}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition',
                                    hasActiveFilters
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border bg-background text-muted-foreground hover:bg-accent',
                                )}
                            >
                                <Filter className="h-3.5 w-3.5" />
                                {tCommon('common.filter')}
                                {hasActiveFilters && (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                                        {timeFilters.length + typeFilters.length + companyFilters.length}
                                    </span>
                                )}
                            </button>
                            <select
                                value={sortKey}
                                onChange={(e) => setSortKey(e.target.value as SortKey)}
                                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="dep_asc">{t('sort_earliest')}</option>
                                <option value="dep_desc">{t('sort_latest')}</option>
                                <option value="price_asc">{t('sort_cheapest')}</option>
                                <option value="price_desc">{t('sort_priciest')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Filter panel */}
                    {filterOpen && results.length > 0 && (
                        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                                    <span className="font-semibold">{tCommon('common.filter')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={() => { setTimeFilters([]); setTypeFilters([]); setCompanyFilters([]) }}
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                            {t('filter_reset')}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setFilterOpen(false)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('time_filter')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(TIME_SLOTS.map((s) => s.key) as TimeSlot[]).map((slot) => (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => toggleFilter(timeFilters, setTimeFilters, slot)}
                                                className={cn(
                                                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                                                    timeFilters.includes(slot)
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-border bg-background hover:bg-accent',
                                                )}
                                            >
                                                {t(`time_${slot}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('bus_type_filter')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(['seat', 'sleeper', 'vip'] as BusType[]).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => toggleFilter(typeFilters, setTypeFilters, type)}
                                                className={cn(
                                                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                                                    typeFilters.includes(type)
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-border bg-background hover:bg-accent',
                                                )}
                                            >
                                                {BUS_TYPE_LABEL[type]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {availableCompanies.length > 1 && (
                                    <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('company_filter')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {availableCompanies.map((name) => (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() => toggleFilter(companyFilters, setCompanyFilters, name)}
                                                    className={cn(
                                                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                                                        companyFilters.includes(name)
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-border bg-background hover:bg-accent',
                                                    )}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Trip cards */}
                    {displayedTrips.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
                            <Search className="h-12 w-12 text-muted-foreground/30" />
                            <p className="font-medium text-muted-foreground">{t('no_results')}</p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={() => { setTimeFilters([]); setTypeFilters([]); setCompanyFilters([]) }}
                                    className="text-sm text-primary hover:underline"
                                >
                                    {t('filter_reset')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayedTrips.map((trip) => (
                                <TripCard
                                    key={trip.id}
                                    trip={trip}
                                    bookLabel={t('book_btn')}
                                    perSeatLabel={t('per_seat')}
                                    seatsLeftLabel={(n: number) => t('seats_left', { count: n })}
                                    busTypeLabel={BUS_TYPE_LABEL[trip.bus.type as BusType] ?? trip.bus.type}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

//  Trip Card 

interface TripCardProps {
    trip: TripWithDetails
    bookLabel: string
    perSeatLabel: string
    seatsLeftLabel: (n: number) => string
    busTypeLabel: string
}

function TripCard({ trip, bookLabel, perSeatLabel, seatsLeftLabel, busTypeLabel }: TripCardProps) {
    const soldOut = trip.availableSeats === 0
    const isLow = trip.availableSeats > 0 && trip.availableSeats <= 5

    return (
        <div className={cn(
            'group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md',
            soldOut ? 'border-border opacity-75' : 'border-border hover:border-primary/30',
        )}>
            <div className="flex flex-wrap items-stretch">
                {/* Main info */}
                <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                    {/* Route row */}
                    <div className="flex items-center gap-3">
                        {/* Departure */}
                        <div className="text-center min-w-[70px]">
                            <p className="text-2xl font-extrabold leading-none tabular-nums">{formatTime(trip.departureTime)}</p>
                            <p className="mt-1 max-w-[80px] truncate text-xs font-medium text-muted-foreground">{trip.route.from}</p>
                        </div>

                        {/* Duration line */}
                        <div className="flex flex-1 flex-col items-center gap-1">
                            <p className="text-xs text-muted-foreground">{formatDuration(trip.route.estimatedMinutes)}</p>
                            <div className="flex w-full items-center gap-1.5">
                                <div className="h-2 w-2 shrink-0 rounded-full border-2 border-primary" />
                                <div className="h-px flex-1 bg-border" />
                                <Bus className="h-4 w-4 shrink-0 text-primary" />
                                <div className="h-px flex-1 bg-border" />
                                <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                            </div>
                        </div>

                        {/* Arrival */}
                        <div className="text-center min-w-[70px]">
                            <p className="text-2xl font-extrabold leading-none tabular-nums">{formatTime(trip.arrivalTime)}</p>
                            <p className="mt-1 max-w-[80px] truncate text-xs font-medium text-muted-foreground">{trip.route.to}</p>
                        </div>
                    </div>

                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                            {trip.company.name}
                        </span>
                        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            {busTypeLabel}
                        </span>
                        <span className={cn(
                            'rounded-lg px-2.5 py-1 text-xs font-medium',
                            soldOut
                                ? 'bg-destructive/10 text-destructive'
                                : isLow
                                    ? 'bg-orange-50 text-orange-600'
                                    : 'bg-green-50 text-green-700',
                        )}>
                            {seatsLeftLabel(trip.availableSeats)}
                        </span>
                    </div>
                </div>

                {/* Price + book */}
                <div className="flex min-w-[150px] flex-col items-center justify-center gap-2 border-l border-border bg-muted/20 px-5 py-4">
                    <div className="text-center">
                        <p className="text-2xl font-extrabold text-primary">{formatVnd(trip.pricePerSeat)}</p>
                        <p className="text-xs text-muted-foreground">{perSeatLabel}</p>
                    </div>
                    {soldOut ? (
                        <span className="w-full rounded-xl bg-muted py-2 text-center text-xs font-medium text-muted-foreground">
                            Hết chỗ
                        </span>
                    ) : (
                        <Button asChild size="sm" className="w-full rounded-xl">
                            <Link to={APP_ROUTES.CUSTOMER.BOOKING(trip.id)}>{bookLabel}</Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

