import { api } from '@/utils/axios.instance'

const unwrap = <T>(response: IResponse<T> | T): T => {
    return (response as IResponse<T>)?.data ?? (response as T)
}

interface CreateBookingDto {
    tripId: string
    seatIds: string[]
    pickupStopId: string
    dropoffStopId: string
    paymentMethod: 'ONLINE' | 'PAY_ON_BOARD'
    passengerName?: string
    passengerEmail?: string
    passengerPhone?: string
}

export async function createBooking(payload: CreateBookingDto, token?: string) {
    const response = await api.post<any>('/v1/bookings', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
    })
    return unwrap(response)
}

export async function createCompanyBooking(payload: CreateBookingDto, companyId: string, token?: string) {
    const response = await api.post<any>(
        `/v1/company/bookings?companyId=${encodeURIComponent(companyId)}`,
        payload,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined, withCredentials: true },
    )
    return unwrap(response)
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

export async function cancelBooking(id: string, token?: string) {
    const response = await api.patch<any>(`/v1/bookings/${encodeURIComponent(id)}/cancel`, undefined, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
    })
    return unwrap(response)
}

export async function listCompanyBookings(companyId: string, query = '', token?: string) {
    const response = await api.get<any>(
        `/v1/company/bookings?companyId=${encodeURIComponent(companyId)}${query ? `&${query}` : ''}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined, withCredentials: true },
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

export async function confirmPayment(bookingCode: string) {
    const response = await api.post<any>('/v1/bookings/webhook/payment', { bookingCode })
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
    createCompanyBooking,
    listMyBookings,
    getBookingByCode,
    cancelBooking,
    listCompanyBookings,
    adminListBookings,
    confirmPayment,
    checkBookingPaymentStatus,
}
