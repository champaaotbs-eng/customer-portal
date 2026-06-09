import { api } from '@/utils/axios.instance'
import { BASE_API_URL, instance } from '@/utils/axios.instance'
import type { Payment } from '@/types'

const unwrap = <T>(response: IResponse<T> | T): T => {
    return (response as IResponse<T>)?.data ?? (response as T)
}

export interface CreateBookingDto {
    tripId: string
    seatIds: string[]
    pickupStopId: string
    dropoffStopId: string
    paymentMethod: 'ONLINE' | 'PAY_ON_BOARD'
    passengerName?: string
    passengerEmail?: string
    passengerPhone?: string
    seatHoldToken?: string
}

export interface BookingResult {
    id: string
    bookingCode: string
    userId?: string
    passengerName?: string
    passengerEmail?: string
    passengerPhone?: string
    tripId: string
    totalAmount: number
    paymentMethod: string
    status: string
    expiresAt?: string
    createdAt: string
    seats?: { id: string; seatId: string; seatCode?: string; price: number }[]
}

export async function createBooking(payload: CreateBookingDto, token?: string): Promise<BookingResult> {
    const response = await api.post<BookingResult>('/v1/bookings', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
    })
    return unwrap(response)
}

export interface SeatHoldPayload {
    tripId: string
    seatIds: string[]
    holderId: string
}

export interface SeatHoldResult {
    heldSeatIds?: string[]
    releasedSeatIds?: string[]
    expiresAt?: number
}

export type SeatHoldEvent = {
    tripId: string
    type: 'snapshot' | 'held' | 'released'
    seatIds: string[]
    holderId?: string
    expiresAt?: number
}

export function getSeatHoldToken() {
    const key = 'booking-seat-hold-token'
    const current = sessionStorage.getItem(key)
    if (current) return current

    const token = crypto.randomUUID()
    sessionStorage.setItem(key, token)
    return token
}

export async function holdSeats(payload: SeatHoldPayload): Promise<SeatHoldResult> {
    const response = await api.post<SeatHoldResult>('/v1/bookings/seat-holds', payload, {
        withCredentials: true,
    })
    return unwrap(response)
}

export async function releaseSeats(payload: SeatHoldPayload): Promise<SeatHoldResult> {
    const response = await instance.delete<any, IResponse<SeatHoldResult>>('/v1/bookings/seat-holds', {
        data: payload,
        withCredentials: true,
    })
    return unwrap(response)
}

export function createSeatHoldEventSource(tripId: string) {
    const url = `${BASE_API_URL}/v1/bookings/seat-holds/events?tripId=${encodeURIComponent(tripId)}`
    return new EventSource(url, { withCredentials: true })
}

export async function listMyBookings(query = '', token?: string) {
    const response = await api.get<any>(`/v1/bookings/my${query ? `?${query}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
    })
    return unwrap(response)
}

export async function getBookingByCode(code: string, token?: string) {
    const response = await api.get<any>(`/v1/bookings/${encodeURIComponent(code)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
    })
    return unwrap(response)
}

export async function getBookingPayment(bookingId: string, token?: string) {
    const response = await api.get<Payment>(`/v1/payments/${encodeURIComponent(bookingId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
    })
    return unwrap(response)
}

export async function cancelBooking(id: string, token?: string) {
    const response = await api.patch<any>(`/v1/bookings/${encodeURIComponent(id)}/cancel`, undefined, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
    })
    return unwrap(response)
}

export async function cancelPaymentBooking(bookingCode: string, passengerEmail: string) {
    const response = await api.patch<any>(
        `/v1/bookings/public/${encodeURIComponent(bookingCode)}/cancel-payment`,
        { passengerEmail },
        { withCredentials: true },
    )
    return unwrap(response)
}

export async function adminListBookings(query = '', token?: string) {
    const response = await api.get<any>(`/v1/admin/bookings${query ? `?${query}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
    })
    return unwrap(response)
}

export interface BookingPaymentStatus {
    bookingCode: string
    bookingStatus: string
    paymentStatus: string | null
    expiresAt: string | null
    isExpired: boolean
    isPaid: boolean
}

export async function checkBookingPaymentStatus(bookingCode: string) {
    const response = await api.get<BookingPaymentStatus>(
        `/v1/bookings/public/${encodeURIComponent(bookingCode)}/payment-status`,
        { withCredentials: true },
    )
    return unwrap(response)
}

export default {
    createBooking,
    listMyBookings,
    getBookingByCode,
    getBookingPayment,
    cancelBooking,
    cancelPaymentBooking,
    adminListBookings,
    checkBookingPaymentStatus,
    holdSeats,
    releaseSeats,
    createSeatHoldEventSource,
}
