import { logout as storeLogout } from '@/store/auth.store'

export interface LoginPayload {
    username: string
    password: string
}

export interface AuthError {
    message: string
}

export function logout() {
    storeLogout()
}

export function isAuthError(val: unknown): val is AuthError {
    return typeof val === 'object' && val !== null && 'message' in val
}
