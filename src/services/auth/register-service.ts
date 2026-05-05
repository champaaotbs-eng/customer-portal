import type { IRegister } from "types/auth/register"

export const register = async (data: Omit<IRegister, 'confirm'>) => {

    // Simulate API call with delay
    return 'abc'
}