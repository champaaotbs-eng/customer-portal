const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function buildUrl(path: string) {
    return BASE ? `${BASE}/api/v1${path}` : `/api/v1${path}`
}

function getAuthHeader(token?: string): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, init)
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const err = new Error(body?.message || res.statusText)
        ;(err as any).code = body?.code || body?.error || null
        throw err
    }
    return (await res.json()) as T
}

interface CreateBookingDto {
    tripId: string
    seatIds: string[]
    pickupStopId: string
    dropoffStopId: string
    paymentMethod: 'ONLINE' | 'PAY_ON_BOARD'
    passengerName?: string
    passengerPhone?: string
}

export async function createBooking(payload: CreateBookingDto, token?: string) {
    return request(buildUrl('/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader(token) },
        body: JSON.stringify(payload),
        credentials: 'include',
    })
}

export async function createCompanyBooking(payload: CreateBookingDto, companyId: string, token?: string) {
    return request(buildUrl(`/company/bookings?companyId=${encodeURIComponent(companyId)}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader(token) },
        body: JSON.stringify(payload),
        credentials: 'include',
    })
}

export async function listMyBookings(query = '', token?: string) {
    const url = buildUrl(`/bookings/my${query ? `?${query}` : ''}`)
    return request(url, { headers: getAuthHeader(token), credentials: 'include' })
}

export async function getBookingByCode(code: string, token?: string) {
    return request(buildUrl(`/bookings/${encodeURIComponent(code)}`), {
        headers: getAuthHeader(token),
        credentials: 'include',
    })
}

export async function cancelBooking(id: string, token?: string) {
    return request(buildUrl(`/bookings/${encodeURIComponent(id)}/cancel`), {
        method: 'PATCH',
        headers: getAuthHeader(token),
        credentials: 'include',
    })
}

export async function listCompanyBookings(companyId: string, query = '', token?: string) {
    const url = buildUrl(`/company/bookings?companyId=${encodeURIComponent(companyId)}${query ? `&${query}` : ''}`)
    return request(url, { headers: getAuthHeader(token), credentials: 'include' })
}

export async function adminListBookings(query = '', token?: string) {
    return request(buildUrl(`/admin/bookings${query ? `?${query}` : ''}`), {
        headers: getAuthHeader(token),
        credentials: 'include',
    })
}

export default {
    createBooking,
    createCompanyBooking,
    listMyBookings,
    getBookingByCode,
    cancelBooking,
    listCompanyBookings,
    adminListBookings,
}
