import type { IRegister } from 'types/auth/register'
import { api } from '@/utils/axios.instance'

export const register = async (data: Omit<IRegister, 'confirm'>) => {
    const response = await api.post<any>('/v1/auth/user/register', data, { withCredentials: true })
    return response.data ?? response
}
