import type { ILogin } from 'types/auth/login'
import { loginWithEmailOtp } from './customer-auth.api'

export interface LoginResult {
    user?: import('types/user/user').User
    message?: string
}

export const login = async (payload: ILogin): Promise<LoginResult> => {
    return loginWithEmailOtp(payload)
}
