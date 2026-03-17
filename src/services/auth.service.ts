import { MOCK_USERS } from '@/data/mock'
import { logout as storeLogout } from '@/store/auth.store'
import type { User } from 'types/user/user'


// Simulate async delay
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

export interface LoginPayload {
    username: string
    password: string
}

export interface AuthError {
    message: string
}

// In-memory user list (seeded from mock)
const users: User[] = [...MOCK_USERS]

// ─── Login ────────────────────────────────────────────────────────────────────


// ─── Logout ───────────────────────────────────────────────────────────────────

export function logout() {
    storeLogout()
}

// ─── Get all users (admin) ────────────────────────────────────────────────────

export async function getAllUsers(): Promise<User[]> {
    await delay(200)
    return [...users]
}

export async function toggleUserStatus(userId: string): Promise<User | null> {
    await delay(200)
    const user = users.find((u) => u.id === userId)
    if (!user) return null
    user.isActive = !user.isActive
    return { ...user }
}

export function isAuthError(val: unknown): val is AuthError {
    return typeof val === 'object' && val !== null && 'message' in val
}
