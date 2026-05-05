import type { IRegister } from 'types/auth/register'

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function buildUrl(path: string) {
    return BASE ? `${BASE}/api/v1${path}` : `/api/v1${path}`
}

export const register = async (data: Omit<IRegister, 'confirm'>) => {
    const res = await fetch(buildUrl('/auth/user/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
        const msg = json?.message || 'Registration failed'
        throw new Error(typeof msg === 'string' ? msg : 'Registration failed')
    }
    return json?.data ?? json
}
