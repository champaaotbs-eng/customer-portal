const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function buildUrl(path: string) {
    return BASE ? `${BASE}/api/v1${path}` : `/api/v1${path}`
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init)
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const err = new Error(body?.message || res.statusText)
        ;(err as any).code = body?.code || null
        throw err
    }
    const json = await res.json()
    return (json?.data ?? json) as T
}

export interface ApiTrip {
    tripId: string
    routeId: string
    fromLocationName?: string
    toLocationName?: string
    busCompanyId: string
    busCompanyName?: string
    busVersionId?: string
    departureTime: string
    arrivalTime: string
    basePrice: number
    status: string
    isPublished: boolean
    tripStops?: ApiTripStop[]
    seatAvailability?: ApiSeat[]
}

export interface ApiTripStop {
    tripStopId: string
    stopType: 'PICKUP' | 'DROPOFF' | 'BOTH'
    locationId?: string
    locationName?: string
    locationAddress?: string
    pickupTime?: string
    dropoffTime?: string
    sortOrder: number
}

export interface ApiSeat {
    seatId: string
    seatCode: string
    seatType: string
    row: number
    col: number
    floor: number
    price: number
    isAvailable: boolean
}

export interface TripListResponse {
    result: ApiTrip[]
    meta: { page: number; limit: number; totalPages: number; totalItems: number }
}

export async function fetchTrips(params: {
    departureDate: string
    limit?: number
    page?: number
}): Promise<TripListResponse> {
    const filters = JSON.stringify({ departureDate: params.departureDate, isPublished: true })
    const url = new URL(buildUrl('/trips'))
    url.searchParams.set('filters', filters)
    url.searchParams.set('limit', String(params.limit ?? 100))
    url.searchParams.set('page', String(params.page ?? 1))
    return request<TripListResponse>(url.toString())
}

export async function fetchTripById(id: string): Promise<ApiTrip> {
    return request<ApiTrip>(buildUrl(`/trips/${encodeURIComponent(id)}`))
}

export interface CreateBookingPayload {
    tripId: string
    seatIds: string[]
    pickupStopId: string
    dropoffStopId: string
    paymentMethod: 'ONLINE' | 'PAY_ON_BOARD'
    passengerName?: string
    passengerPhone?: string
}

export interface BookingResult {
    id: string
    bookingCode: string
    userId?: string
    passengerName?: string
    passengerPhone?: string
    tripId: string
    totalAmount: number
    paymentMethod: string
    status: string
    expiresAt?: string
    createdAt: string
    seats?: { id: string; seatId: string; seatCode?: string; price: number }[]
}

export async function createBooking(
    payload: CreateBookingPayload,
    token?: string,
): Promise<BookingResult> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return request<BookingResult>(buildUrl('/bookings'), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
    })
}
