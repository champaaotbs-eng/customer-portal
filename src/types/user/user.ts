import type { Role } from "./role"

export interface User {
    id: string
    name: string
    username: string
    email: string
    password: string // hashed in real app
    role: Role
    companyId?: string // only for bus_company role
    phone?: string
    avatarUrl?: string
    provider?: string // social login provider
    isVerified?: boolean
    isActive: boolean
    createdAt: string
}