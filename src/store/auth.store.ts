import { Store } from '@tanstack/store'
import { useState, useEffect } from 'react'
import type { User } from '@/types'

// ─── State ────────────────────────────────────────────────────────────────────

export interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
}

// Persist to sessionStorage for page reloads
const STORAGE_KEY = 'vexe_auth_user'

function loadFromStorage(): User | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as User) : null
    } catch {
        return null
    }
}

const storedUser = loadFromStorage()

export const authStore = new Store<AuthState>({
    user: storedUser,
    isAuthenticated: storedUser !== null,
    isLoading: false,
})

// ─── Actions ────────────────────────────────────────────────────────────────────

export function setUser(user: User | null) {
    if (user) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
        sessionStorage.removeItem(STORAGE_KEY)
    }
    authStore.setState((s) => ({
        ...s,
        user,
        isAuthenticated: user !== null,
        isLoading: false,
    }))
}

export function logout() {
    setUser(null)
}
// ─── React Hook ───────────────────────────────────────────────────────────────

/**
 * React hook to subscribe to auth state changes.
 * Use this instead of @tanstack/react-store's useStore,
 * as that package expects a different atom API.
 */
export function useAuthStore(): AuthState {
    const [state, setState] = useState<AuthState>(authStore.state)

    useEffect(() => {
        // subscribe returns unsubscribe fn
        return authStore.subscribe(() => {
            setState({ ...authStore.state })
        })
    }, [])

    return state
}