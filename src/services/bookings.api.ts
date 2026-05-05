// lightweight API client for bookings

const BASE = import.meta.env.VITE_API_BASE_URL || ''

function buildUrl(path: string) {
    return BASE ? `${BASE.replace(/\/$/, '')}/api/v1${path}` : path
}

function getAuthHeader(token?: string) {
    return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(input: RequestInfo, init?: RequestInit) {
    const res = await fetch(input, init)
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const err = new Error(body?.message || res.statusText)
            // attach server error code if present
            ; (err as any).code = body?.code || body?.error || null
        throw err
    }
    return (await res.json()) as T
}

export async function createBooking(payload: CreateBookingDto, token?: string) {
    if (!BASE) throw new Error('API base URL not configured')
    const url = buildUrl('/bookings')
    return request(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(token),
        },
        body: JSON.stringify(payload),
    })
}

export async function createCompanyBooking(payload: CreateBookingDto, companyId: string, token?: string) {
    if (!BASE) throw new Error('API base URL not configured')
    const url = buildUrl(`/company/bookings?companyId=${encodeURIComponent(companyId)}`)
    return request(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(token),
        },
        body: JSON.stringify(payload),
    })
}

export async function listMyBookings(query = '', token?: string) {
    if (!BASE) throw new Error('API base URL not configured')
    const url = buildUrl(`/bookings/my${query ? `?${query}` : ''}`)
    return request(url, { headers: getAuthHeader(token) })
}

export async function getBookingByCode(code: string, token?: string) {
    if (!BASE) throw new Error('API base URL not configured')
    const url = buildUrl(`/bookings/${encodeURIComponent(code)}`)
    return request(url, { headers: getAuthHeader(token) })
}

export async function cancelBooking(id: string, token?: string) {
    if (!BASE) throw new Error('API base URL not configured')
    const url = buildUrl(`/bookings/${encodeURIComponent(id)}/cancel`)
    return request(url, { method: 'PATCH', headers: getAuthHeader(token) })
}

export async function listCompanyBookings(companyId: string, query = '', token?: string) {
    if (!BASE) throw new Error('API base URL not configured')
    const url = buildUrl(`/company/bookings?companyId=${encodeURIComponent(companyId)}${query ? `&${query}` : ''}`)
    return request(url, { headers: getAuthHeader(token) })
}

export async function adminListBookings(query = '', token?: string) {
    if (!BASE) throw new Error('API base URL not configured')
    const url = buildUrl(`/admin/bookings${query ? `?${query}` : ''}`)
    return request(url, { headers: getAuthHeader(token) })
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
