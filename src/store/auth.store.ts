import { Store } from '@tanstack/store'
import { useState, useEffect } from 'react'
import type { User } from '@/types'

export interface AuthState {
    user: User | null
    accessToken: string | null
    isAuthenticated: boolean
    isLoading: boolean
}

const STORAGE_KEY = 'vexe_auth_user'
const TOKEN_KEY = 'vexe_access_token'

function loadFromStorage(): { user: User | null; accessToken: string | null } {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        const token = sessionStorage.getItem(TOKEN_KEY)
        return {
            user: raw ? (JSON.parse(raw) as User) : null,
            accessToken: token,
        }
    } catch {
        return { user: null, accessToken: null }
    }
}

const stored = loadFromStorage()

export const authStore = new Store<AuthState>({
    user: stored.user,
    accessToken: stored.accessToken,
    isAuthenticated: stored.user !== null,
    isLoading: false,
})

export function setAuth(user: User | null, accessToken: string | null) {
    if (user) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
        sessionStorage.removeItem(STORAGE_KEY)
    }
    if (accessToken) {
        sessionStorage.setItem(TOKEN_KEY, accessToken)
    } else {
        sessionStorage.removeItem(TOKEN_KEY)
    }
    authStore.setState((s) => ({
        ...s,
        user,
        accessToken,
        isAuthenticated: user !== null,
        isLoading: false,
    }))
}

export function setUser(user: User | null) {
    setAuth(user, user ? authStore.state.accessToken : null)
}

export function logout() {
    setAuth(null, null)
}

export function useAuthStore(): AuthState {
    const [state, setState] = useState<AuthState>(authStore.state)

    useEffect(() => {
        return authStore.subscribe(() => {
            setState({ ...authStore.state })
        })
    }, [])

    return state
}
