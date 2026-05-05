import { setAuth } from 'store/auth.store'
import type { ILogin } from 'types/auth/login'
import type { User } from 'types/user/user'

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function buildUrl(path: string) {
    return BASE ? `${BASE}/api/v1${path}` : `/api/v1${path}`
}

export interface LoginResult {
    user?: User
    message?: string
}

export const login = async (payload: ILogin): Promise<LoginResult> => {
    try {
        const res = await fetch(buildUrl('/auth/user/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        })

        const json = await res.json().catch(() => ({}))
        const data = json?.data ?? json

        if (!res.ok || !data?.accessToken) {
            const msg = json?.message || data?.message || 'incorrect_credentials'
            return { message: typeof msg === 'string' ? msg : 'incorrect_credentials' }
        }

        const raw = data.user
        const user: User = {
            id: raw.userId,
            name: raw.fullName,
            email: raw.email,
            phone: raw.phone ?? undefined,
            address: raw.address ?? undefined,
            isActive: true,
            createdAt: new Date().toISOString(),
        }

        setAuth(user, data.accessToken)
        return { user }
    } catch {
        return { message: 'incorrect_credentials' }
    }
}
