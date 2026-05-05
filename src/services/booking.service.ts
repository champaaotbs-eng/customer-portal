import { MOCK_TICKETS } from '@/data/mock'
import type { Ticket, TicketStatus, PaymentMethod, PaymentProvider } from '@/types'
import * as bookingsApi from './bookings.api'
import { authStore } from '@/store/auth.store'

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

const tickets: Ticket[] = [...MOCK_TICKETS]
let nextTicketId = tickets.length + 1

// ─── Book Ticket ──────────────────────────────────────────────────────────────

export interface BookTicketPayload {
    tripId: string
    customerId: string
    seatNumbers: string[]
    pricePerSeat: number
    passengerName: string
    passengerPhone: string
    note?: string
    pickupPointId?: string
    pickupPointName?: string
    dropoffPointId?: string
    dropoffPointName?: string
    paymentMethod: PaymentMethod
    paymentProvider?: PaymentProvider
}

export async function bookTicket(
    payload: BookTicketPayload,
): Promise<Ticket> {
    // If API base is configured, call real backend
    if (import.meta.env.VITE_API_BASE_URL) {
        // try to send with any available auth token
        const token = authStore.state.user && (authStore.state.user as any).token
        const dto: any = {
            tripId: payload.tripId,
            seatIds: payload.seatNumbers, // backend expects seatIds/uuids; best-effort
            pickupStopId: payload.pickupPointId,
            dropoffStopId: payload.dropoffPointId,
            paymentMethod: payload.paymentMethod === 'online' ? 'ONLINE' : 'PAY_ON_BOARD',
        }
        const res = await bookingsApi.createBooking(dto, token).catch((e) => {
            throw e
        })
        // Map backend response shape to Ticket type as best-effort
        const ticket: Ticket = {
            id: res.id,
            tripId: res.tripId,
            customerId: payload.customerId,
            seatNumbers: (res.seats ?? []).map((s: any) => s.seatCode || s.id || String(s)),
            totalPrice: res.totalAmount ?? payload.seatNumbers.length * payload.pricePerSeat,
            status: (res.status || 'pending_payment').toLowerCase(),
            expiresAt: res.expiresAt || res.expires_at || undefined,
            passengerName: payload.passengerName,
            passengerPhone: payload.passengerPhone,
            note: payload.note,
            createdAt: res.createdAt || new Date().toISOString(),
            pickupPointId: res.pickupStopId ?? payload.pickupPointId,
            pickupPointName: res.pickupStopId ? undefined : payload.pickupPointName,
            dropoffPointId: res.dropoffStopId ?? payload.dropoffPointId,
            dropoffPointName: res.dropoffStopId ? undefined : payload.dropoffPointName,
            paymentMethod: payload.paymentMethod,
            paymentProvider: payload.paymentProvider,
        }
        tickets.push(ticket)
        return ticket
    }

    await delay()

    const ticket: Ticket = {
        id: `tk${nextTicketId++}`,
        tripId: payload.tripId,
        customerId: payload.customerId,
        seatNumbers: payload.seatNumbers,
        totalPrice: payload.seatNumbers.length * payload.pricePerSeat,
        status: 'confirmed',
        passengerName: payload.passengerName,
        passengerPhone: payload.passengerPhone,
        note: payload.note,
        createdAt: new Date().toISOString(),
        pickupPointId: payload.pickupPointId,
        pickupPointName: payload.pickupPointName,
        dropoffPointId: payload.dropoffPointId,
        dropoffPointName: payload.dropoffPointName,
        paymentMethod: payload.paymentMethod,
        paymentProvider: payload.paymentProvider,
    }

    tickets.push(ticket)
    return ticket
}

// ─── Get Tickets by Customer ──────────────────────────────────────────────────

export async function getTicketsByCustomer(customerId: string): Promise<Ticket[]> {
    // If backend configured, fetch real bookings
    if (import.meta.env.VITE_API_BASE_URL) {
        const token = authStore.state.user && (authStore.state.user as any).token
        const res: any = await bookingsApi.listMyBookings('', token).catch(() => null)
        if (res && Array.isArray(res.result ?? res)) {
            const items = (res.result ?? res) as any[]
            return items
                .map(mapBookingToTicket)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }
    }

    await delay()
    return tickets
        .filter((t) => t.customerId === customerId)
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
}

// ─── Get Tickets by Trip ──────────────────────────────────────────────────────

export async function getTicketsByTrip(tripId: string): Promise<Ticket[]> {
    if (import.meta.env.VITE_API_BASE_URL) {
        // Try listing company/admin or searching bookings by trip isn't exposed in minimal client
        // Fallback to local mock
        await delay(100)
        return tickets.filter((t) => t.tripId === tripId)
    }
    await delay(200)
    return tickets.filter((t) => t.tripId === tripId)
}

// ─── Cancel Ticket ────────────────────────────────────────────────────────────

export async function cancelTicket(ticketId: string): Promise<boolean> {
    if (import.meta.env.VITE_API_BASE_URL) {
        const token = authStore.state.user && (authStore.state.user as any).token
        const res = await bookingsApi.cancelBooking(ticketId, token).catch(() => null)
        // backend returns updated booking; assume success if not null
        if (res) return true
        return false
    }

    await delay(200)
    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket || ticket.status === 'completed') return false
    ticket.status = 'cancelled'
    return true
}

// ─── Get All Tickets (admin / company) ───────────────────────────────────────

export async function getAllTickets(): Promise<Ticket[]> {
    if (import.meta.env.VITE_API_BASE_URL) {
        // admin listing not implemented in mock API client for now
        await delay(100)
        return [...tickets]
    }
    await delay()
    return [...tickets]
}

export async function updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
): Promise<Ticket | null> {
    if (import.meta.env.VITE_API_BASE_URL) {
        // Not implemented: map to admin API
        await delay(100)
        const ticket = tickets.find((t) => t.id === ticketId)
        if (!ticket) return null
        ticket.status = status
        return { ...ticket }
    }
    await delay(200)
    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket) return null
    ticket.status = status
    return { ...ticket }
}

function mapBookingToTicket(b: any): Ticket {
    return {
        id: b.id || b.booking?.id || String(b.bookingCode ?? Math.random()).slice(0, 12),
        tripId: b.tripId || b.trip?.id || b.tripId,
        customerId: b.userId || b.user?.id || '',
        seatNumbers: (b.seats ?? []).map((s: any) => s.seatCode || s.seatId || s.id || String(s)),
        totalPrice: b.totalAmount ?? b.amount ?? 0,
        status: (b.status || 'pending_payment').startsWith('PENDING') ? 'pending' : (b.status || 'pending').toLowerCase(),
        passengerName: b.passengerName || '',
        passengerPhone: b.passengerPhone || '',
        note: b.note,
        createdAt: b.createdAt || new Date().toISOString(),
        pickupPointId: b.pickupStopId || b.pickupPointId,
        pickupPointName: b.pickupStopName || b.pickupPointName,
        dropoffPointId: b.dropoffStopId || b.dropoffPointId,
        dropoffPointName: b.dropoffStopName || b.dropoffPointName,
        paymentMethod: b.paymentMethod === 'ONLINE' ? 'online' : b.paymentMethod === 'PAY_ON_BOARD' ? 'pay_on_board' : undefined,
        paymentProvider: b.paymentProvider,
    }
}
