import type { IRegister } from 'types/auth/register'
import { registerWithEmailOtp } from './customer-auth.api'

export const register = async (data: IRegister) => {
    return registerWithEmailOtp(data)
}
