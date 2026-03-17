import { MOCK_TICKETS } from '@/data/mock'
import type { Ticket, TicketStatus, PaymentMethod, PaymentProvider } from '@/types'

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
    await delay(200)
    return tickets.filter((t) => t.tripId === tripId)
}

// ─── Cancel Ticket ────────────────────────────────────────────────────────────

export async function cancelTicket(ticketId: string): Promise<boolean> {
    await delay(200)
    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket || ticket.status === 'completed') return false
    ticket.status = 'cancelled'
    return true
}

// ─── Get All Tickets (admin / company) ───────────────────────────────────────

export async function getAllTickets(): Promise<Ticket[]> {
    await delay()
    return [...tickets]
}

export async function updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
): Promise<Ticket | null> {
    await delay(200)
    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket) return null
    ticket.status = status
    return { ...ticket }
}
