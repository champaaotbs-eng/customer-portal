import {
    MOCK_TRIPS,
    MOCK_COMPANIES,
    MOCK_ROUTES,
    MOCK_BUSES,
    MOCK_PICKUP_POINTS,
    MOCK_DROPOFF_POINTS,
} from '@/data/mock'
import type { Trip, TripWithDetails, TripSearchParams } from '@/types'

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

// In-memory trip store
const trips: Trip[] = [...MOCK_TRIPS]
let nextTripId = trips.length + 1

// ─── Helper ───────────────────────────────────────────────────────────────────

function enrichTrip(trip: Trip): TripWithDetails | null {
    const company = MOCK_COMPANIES.find((c) => c.id === trip.companyId)
    const route = MOCK_ROUTES.find((r) => r.id === trip.routeId)
    const bus = MOCK_BUSES.find((b) => b.id === trip.busId)
    if (!company || !route || !bus) return null
    const pickupPoints = MOCK_PICKUP_POINTS.filter((p) => p.tripId === trip.id)
    const dropoffPoints = MOCK_DROPOFF_POINTS.filter((p) => p.tripId === trip.id)
    return { ...trip, company, route, bus, pickupPoints, dropoffPoints }
}

// ─── Search Trips (for customers) ────────────────────────────────────────────

export async function searchTrips(
    params: TripSearchParams,
): Promise<TripWithDetails[]> {
    await delay()

    const searchDate = params.date // YYYY-MM-DD
    const seats = params.passengers ?? 1

    return trips
        .filter((trip) => {
            if (trip.status === 'cancelled' || trip.status === 'completed') return false
            const route = MOCK_ROUTES.find((r) => r.id === trip.routeId)
            if (!route) return false
            const fromMatch =
                route.from.toLowerCase().includes(params.from.toLowerCase())
            const toMatch = route.to.toLowerCase().includes(params.to.toLowerCase())
            const dateMatch = trip.departureTime.startsWith(searchDate)
            const seatsOk = trip.availableSeats >= seats
            return fromMatch && toMatch && dateMatch && seatsOk
        })
        .map(enrichTrip)
        .filter((t): t is TripWithDetails => t !== null)
}

// ─── Get Trip by ID ───────────────────────────────────────────────────────────

export async function getTripById(
    id: string,
): Promise<TripWithDetails | null> {
    await delay(100)
    const trip = trips.find((t) => t.id === id)
    if (!trip) return null
    return enrichTrip(trip)
}

// ─── Get Trips by Company ─────────────────────────────────────────────────────

export async function getTripsByCompany(
    companyId: string,
): Promise<TripWithDetails[]> {
    await delay()
    return trips
        .filter((t) => t.companyId === companyId)
        .map(enrichTrip)
        .filter((t): t is TripWithDetails => t !== null)
}

// ─── Create Trip ──────────────────────────────────────────────────────────────

export interface CreateTripPayload {
    companyId: string
    routeId: string
    busId: string
    departureTime: string
    pricePerSeat: number
}

export async function createTrip(
    payload: CreateTripPayload,
): Promise<TripWithDetails | null> {
    await delay()

    const bus = MOCK_BUSES.find((b) => b.id === payload.busId)
    const route = MOCK_ROUTES.find((r) => r.id === payload.routeId)
    if (!bus || !route) return null

    const departureMs = new Date(payload.departureTime).getTime()
    const arrivalMs = departureMs + route.estimatedMinutes * 60 * 1000

    const newTrip: Trip = {
        id: `t${nextTripId++}`,
        companyId: payload.companyId,
        routeId: payload.routeId,
        busId: payload.busId,
        departureTime: new Date(departureMs).toISOString(),
        arrivalTime: new Date(arrivalMs).toISOString(),
        pricePerSeat: payload.pricePerSeat,
        availableSeats: bus.totalSeats,
        status: 'scheduled',
    }
    trips.push(newTrip)
    return enrichTrip(newTrip)
}

// ─── Cancel Trip ──────────────────────────────────────────────────────────────

export async function cancelTrip(tripId: string): Promise<boolean> {
    await delay(200)
    const trip = trips.find((t) => t.id === tripId)
    if (!trip) return false
    trip.status = 'cancelled'
    return true
}

// ─── Get all routes & buses ───────────────────────────────────────────────────

export async function getAllRoutes() {
    await delay(100)
    return [...MOCK_ROUTES]
}

export async function getBusesByCompany(companyId: string) {
    await delay(100)
    return MOCK_BUSES.filter((b) => b.companyId === companyId)
}

// ─── Get all trips (admin) ────────────────────────────────────────────────────

export async function getAllTrips(): Promise<TripWithDetails[]> {
    await delay()
    return trips
        .map(enrichTrip)
        .filter((t): t is TripWithDetails => t !== null)
}
