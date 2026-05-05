import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { Search, ArrowLeftRight, SlidersHorizontal, Bus, Clock, MapPin, Filter, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchTrips, type ApiTrip } from '@/services/trips.api'
import { Button } from '@/components/ui/button'
import { formatTime, formatDuration, formatVnd } from '@/utils/format'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

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

function estimateMins(departureTime: string, arrivalTime: string): number {
    return Math.round((new Date(arrivalTime).getTime() - new Date(departureTime).getTime()) / 60000)
}

export function CustomerSearchPage() {
    const { t } = useTranslation('translation', { keyPrefix: 'pages.search' })
    const { t: tCommon } = useTranslation()
    const navigate = useNavigate()
    const today = new Date().toISOString().split('T')[0]

    const searchParams = useSearch({ from: '/customer/search' }) as { from: string; to: string; date: string }

    const [from, setFrom] = useState(searchParams.from)
    const [to, setTo] = useState(searchParams.to)
    const [date, setDate] = useState(searchParams.date || today)

    const [sortKey, setSortKey] = useState<SortKey>('dep_asc')
    const [timeFilters, setTimeFilters] = useState<TimeSlot[]>([])
    const [companyFilters, setCompanyFilters] = useState<string[]>([])
    const [filterOpen, setFilterOpen] = useState(false)

    // Sync form when URL params change
    useEffect(() => {
        setFrom(searchParams.from)
        setTo(searchParams.to)
        if (searchParams.date) setDate(searchParams.date)
    }, [searchParams.from, searchParams.to, searchParams.date])

    const shouldFetch = !!(searchParams.date)

    const { data: tripData, isLoading, isError } = useQuery({
        queryKey: ['public-trips', searchParams.date],
        queryFn: () => fetchTrips({ departureDate: searchParams.date, limit: 200 }),
        enabled: shouldFetch,
        staleTime: 2 * 60 * 1000,
    })

    const allTrips: ApiTrip[] = tripData?.result ?? []

    const filteredBySearch = useMemo(() => {
        if (!searchParams.from && !searchParams.to) return allTrips
        return allTrips.filter(trip => {
            const fromMatch = !searchParams.from ||
                (trip.fromLocationName ?? '').toLowerCase().includes(searchParams.from.toLowerCase())
            const toMatch = !searchParams.to ||
                (trip.toLocationName ?? '').toLowerCase().includes(searchParams.to.toLowerCase())
            return fromMatch && toMatch
        })
    }, [allTrips, searchParams.from, searchParams.to])

    const availableCompanies = useMemo(
        () => Array.from(new Set(filteredBySearch.map(t => t.busCompanyName ?? ''))).filter(Boolean),
        [filteredBySearch],
    )

    const displayedTrips = useMemo(() => {
        let out = [...filteredBySearch]
        if (timeFilters.length > 0)
            out = out.filter(t => timeFilters.some(s => hourInSlot(t.departureTime, s)))
        if (companyFilters.length > 0)
            out = out.filter(t => companyFilters.includes(t.busCompanyName ?? ''))
        out.sort((a, b) => {
            if (sortKey === 'price_asc') return a.basePrice - b.basePrice
            if (sortKey === 'price_desc') return b.basePrice - a.basePrice
            if (sortKey === 'dep_asc')
                return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
            return new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime()
        })
        return out
    }, [filteredBySearch, timeFilters, companyFilters, sortKey])

    function toggleFilter<T>(arr: T[], setArr: (v: T[]) => void, val: T) {
        setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
    }

    const hasActiveFilters = timeFilters.length > 0 || companyFilters.length > 0

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        navigate({ to: '/customer/search', search: { from, to, date } })
    }

    function swap() {
        const tmp = from
        setFrom(to)
        setTo(tmp)
    }

    const hasSearched = !!searchParams.date

    return (
        <div className="space-y-6">
            {/* Search form */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border bg-primary/5 px-6 py-4">
                    <h1 className="text-xl font-bold">{t('title')}</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t('subtitle')}</p>
                </div>

                <form onSubmit={handleSearch} className="p-6 space-y-5">
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-1.5">
                            <label className="flex items-center gap-1.5 text-sm font-semibold">
                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                {t('from')}
                            </label>
                            <input
                                type="text"
                                required
                                value={from}
                                onChange={e => setFrom(e.target.value)}
                                placeholder={t('from_placeholder')}
                                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={swap}
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
                            <input
                                type="text"
                                required
                                value={to}
                                onChange={e => setTo(e.target.value)}
                                placeholder={t('to_placeholder')}
                                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-sm font-semibold">
                                <Clock className="h-3.5 w-3.5 text-primary" />
                                {t('date')}
                            </label>
                            <input
                                type="date"
                                min={today}
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <div className="text-xs text-muted-foreground">
                            {isError && <span className="text-destructive">{tCommon('common.error')}</span>}
                        </div>
                        <Button type="submit" loading={isLoading} size="lg" className="min-w-[160px] gap-2">
                            <Search className="h-4 w-4" />
                            {t('search_btn')}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Results */}
            {hasSearched && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-sm">
                        <p className="font-semibold">
                            {isLoading ? (
                                <span className="text-muted-foreground text-sm">{tCommon('common.loading')}</span>
                            ) : (
                                <>
                                    <span className="text-primary">{displayedTrips.length}</span>
                                    <span className="text-muted-foreground ml-1 text-sm">
                                        {t('results_count', { count: filteredBySearch.length })}
                                    </span>
                                </>
                            )}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setFilterOpen(o => !o)}
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
                                        {timeFilters.length + companyFilters.length}
                                    </span>
                                )}
                            </button>
                            <select
                                value={sortKey}
                                onChange={e => setSortKey(e.target.value as SortKey)}
                                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="dep_asc">{t('sort_earliest')}</option>
                                <option value="dep_desc">{t('sort_latest')}</option>
                                <option value="price_asc">{t('sort_cheapest')}</option>
                                <option value="price_desc">{t('sort_priciest')}</option>
                            </select>
                        </div>
                    </div>

                    {filterOpen && filteredBySearch.length > 0 && (
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
                                            onClick={() => { setTimeFilters([]); setCompanyFilters([]) }}
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

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('time_filter')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(TIME_SLOTS.map(s => s.key) as TimeSlot[]).map(slot => (
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

                                {availableCompanies.length > 1 && (
                                    <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('company_filter')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {availableCompanies.map(name => (
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

                    {!isLoading && displayedTrips.length === 0 && (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
                            <Search className="h-12 w-12 text-muted-foreground/30" />
                            <p className="font-medium text-muted-foreground">{t('no_results')}</p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={() => { setTimeFilters([]); setCompanyFilters([]) }}
                                    className="text-sm text-primary hover:underline"
                                >
                                    {t('filter_reset')}
                                </button>
                            )}
                        </div>
                    )}

                    {displayedTrips.length > 0 && (
                        <div className="space-y-3">
                            {displayedTrips.map(trip => (
                                <TripCard
                                    key={trip.tripId}
                                    trip={trip}
                                    bookLabel={t('book_btn')}
                                    perSeatLabel={t('per_seat')}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function TripCard({ trip, bookLabel, perSeatLabel }: {
    trip: ApiTrip
    bookLabel: string
    perSeatLabel: string
}) {
    const durationMins = estimateMins(trip.departureTime, trip.arrivalTime)

    return (
        <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md hover:border-primary/30">
            <div className="flex flex-wrap items-stretch">
                <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                    <div className="flex items-center gap-3">
                        <div className="text-center min-w-[70px]">
                            <p className="text-2xl font-extrabold leading-none tabular-nums">{formatTime(trip.departureTime)}</p>
                            <p className="mt-1 max-w-[90px] truncate text-xs font-medium text-muted-foreground">{trip.fromLocationName ?? '—'}</p>
                        </div>

                        <div className="flex flex-1 flex-col items-center gap-1">
                            <p className="text-xs text-muted-foreground">{formatDuration(durationMins)}</p>
                            <div className="flex w-full items-center gap-1.5">
                                <div className="h-2 w-2 shrink-0 rounded-full border-2 border-primary" />
                                <div className="h-px flex-1 bg-border" />
                                <Bus className="h-4 w-4 shrink-0 text-primary" />
                                <div className="h-px flex-1 bg-border" />
                                <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                            </div>
                        </div>

                        <div className="text-center min-w-[70px]">
                            <p className="text-2xl font-extrabold leading-none tabular-nums">{formatTime(trip.arrivalTime)}</p>
                            <p className="mt-1 max-w-[90px] truncate text-xs font-medium text-muted-foreground">{trip.toLocationName ?? '—'}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {trip.busCompanyName && (
                            <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                                {trip.busCompanyName}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex min-w-[150px] flex-col items-center justify-center gap-2 border-l border-border bg-muted/20 px-5 py-4">
                    <div className="text-center">
                        <p className="text-2xl font-extrabold text-primary">{formatVnd(trip.basePrice)}</p>
                        <p className="text-xs text-muted-foreground">{perSeatLabel}</p>
                    </div>
                    <Button asChild size="sm" className="w-full rounded-xl">
                        <Link to={APP_ROUTES.CUSTOMER.BOOKING(trip.tripId)}>{bookLabel}</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
