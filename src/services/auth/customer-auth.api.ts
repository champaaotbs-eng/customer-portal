import { api } from '@/utils/axios.instance'
import { setAuth } from '@/store/auth.store'
import type { User } from '@/types/user/user'

type SessionResponse = {
    accessToken: string
    user: {
        userId: string
        fullName: string
        email: string
        phone?: string
        address?: string
    }
    isNewUser?: boolean
}

export interface AuthResult {
    user?: User
    isNewUser?: boolean
    message?: string
}

function mapAuthMessage(message?: string) {
    switch (message) {
        case 'user_not_found':
            return 'Email does not exist in the system.'
        case 'email_verification_mismatch':
            return 'The verified email does not match the submitted email.'
        case 'phone_already_exists':
            return 'This phone number already belongs to another account.'
        case 'email_already_exists':
            return 'This email address already belongs to another account.'
        case 'email_already_registered_login_required':
            return 'This email address already belongs to an account. Log in to continue.'
        case 'booking_email_mismatch_requires_reauth':
            return 'Verify this email address before continuing with the booking.'
        case 'email_required_for_new_email_account':
            return 'Email is required to create a new account.'
        case 'invalid_otp':
            return 'The OTP is invalid or expired.'
        case 'otp_send_failed':
            return 'Failed to send OTP to this email address.'
        case 'otp_provider_not_configured':
        case 'otp_provider_error':
        case 'otp_provider_unavailable':
            return 'OTP service is unavailable right now.'
        default:
            return message || 'Authentication failed.'
    }
}

function mapUser(raw: SessionResponse['user']): User {
    return {
        id: raw.userId,
        name: raw.fullName,
        email: raw.email,
        phone: raw.phone ?? undefined,
        address: raw.address ?? undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
    }
}

function applySession(data: SessionResponse): AuthResult {
    const user = mapUser(data.user)
    setAuth(user, data.accessToken)
    return { user, isNewUser: data.isNewUser }
}

export async function sendCustomerEmailOtp(email: string): Promise<{ sent?: boolean; message?: string }> {
    try {
        const response = await api.post<{ sent: boolean }>('/v1/auth/customer/email-otp/send', { email }, { withCredentials: true })
        return response.data ?? (response as { sent: boolean })
    } catch (error: any) {
        return { message: mapAuthMessage(error?.response?.data?.message) || error?.localizedMessage || 'otp_send_failed' }
    }
}

export async function sendLoginEmailOtp(email: string): Promise<{ sent?: boolean; message?: string }> {
    try {
        const response = await api.post<{ sent: boolean }>('/v1/auth/user/login-otp', { email }, { withCredentials: true })
        return response.data ?? (response as { sent: boolean })
    } catch (error: any) {
        return { message: mapAuthMessage(error?.response?.data?.message) || error?.localizedMessage || 'otp_send_failed' }
    }
}

export async function loginWithEmailOtp(payload: {
    email: string
    otp: string
}): Promise<AuthResult> {
    try {
        const response = await api.post<SessionResponse>('/v1/auth/user/login-otp/verify', payload, { withCredentials: true })
        const data = response.data ?? (response as SessionResponse)
        return applySession(data)
    } catch (error: any) {
        return { message: mapAuthMessage(error?.response?.data?.message) || error?.localizedMessage || 'login_failed' }
    }
}

export async function registerWithEmailOtp(payload: {
    fullName: string
    email: string
    phone: string
    otp: string
}): Promise<AuthResult> {
    try {
        const response = await api.post<SessionResponse>('/v1/auth/customer/register-with-email-otp', payload, { withCredentials: true })
        const data = response.data ?? (response as SessionResponse)
        return applySession(data)
    } catch (error: any) {
        return { message: mapAuthMessage(error?.response?.data?.message) || error?.localizedMessage || 'registration_failed' }
    }
}

export async function resolveOrCreateWithEmailOtp(payload: {
    email: string
    fullName: string
    phone: string
    otp: string
}): Promise<AuthResult> {
    try {
        const response = await api.post<SessionResponse>('/v1/auth/customer/email-otp/resolve-or-create', payload, { withCredentials: true })
        const data = response.data ?? (response as SessionResponse)
        return applySession(data)
    } catch (error: any) {
        return { message: mapAuthMessage(error?.response?.data?.message) || error?.localizedMessage || 'login_failed' }
    }
}
