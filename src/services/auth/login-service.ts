import { setAuth } from 'store/auth.store'
import type { ILogin } from 'types/auth/login'
import type { User } from 'types/user/user'
import { api } from '@/utils/axios.instance'

export interface LoginResult {
    user?: User
    message?: string
}

export const login = async (payload: ILogin): Promise<LoginResult> => {
    try {
        const response = await api.post<{ accessToken: string; user: any }>('/v1/auth/user/login', payload, {
            withCredentials: true,
        })
        const data = response.data ?? (response as any)
        if (!data?.accessToken) {
            const msg = response.message || data?.message || 'incorrect_credentials'
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
