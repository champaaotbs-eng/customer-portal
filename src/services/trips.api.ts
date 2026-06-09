import { api } from '@/utils/axios.instance'

const unwrap = <T>(response: IResponse<T> | T): T => {
    return (response as IResponse<T>)?.data ?? (response as T)
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
    stopType: 'PICKUP' | 'DROPOFF'
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
    status?: 'available' | 'held' | 'booked'
    isAvailable: boolean
    isHeld?: boolean
}

export interface TripListResponse {
    result: ApiTrip[]
    meta: { page: number; limit: number; totalPages: number; totalItems: number }
}

function getSeatHoldToken() {
    return sessionStorage.getItem('booking-seat-hold-token') ?? ''
}

export async function fetchTrips(params: {
    departureDate: string
    fromLocation?: string
    toLocation?: string
    limit?: number
    page?: number
}): Promise<TripListResponse> {
    const qs = new URLSearchParams({
        date: params.departureDate,
        ...(params.fromLocation?.trim() ? { from: params.fromLocation.trim() } : {}),
        ...(params.toLocation?.trim() ? { to: params.toLocation.trim() } : {}),
        limit: String(params.limit ?? 100),
        page: String(params.page ?? 1),
    })
    const response = await api.get<TripListResponse | ApiTrip[]>(`/v1/trips/search?${qs.toString()}`)
    const data = unwrap(response)
    if (Array.isArray(data)) {
        const totalItems = data.length
        const limit = params.limit ?? 100
        return {
            result: data,
            meta: {
                page: params.page ?? 1,
                limit,
                totalPages: limit ? Math.ceil(totalItems / limit) : 1,
                totalItems,
            },
        }
    }
    return data
}

export async function fetchTripById(id: string): Promise<ApiTrip> {
    const seatHoldToken = getSeatHoldToken()
    const response = await api.get<ApiTrip>(`/v1/trips/${encodeURIComponent(id)}`, {
        params: seatHoldToken ? { seatHoldToken } : undefined,
    })
    return unwrap(response)
}
