import { MOCK_USERS } from "data/mock"
import { setUser } from "store/auth.store"
import type { ILogin } from "types/auth/login"
import type { User } from "types/user/user"

const users: User[] = [...MOCK_USERS]
// Simulate async delay
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

export const login = async (
    payload: ILogin,
) => {
    return delay().then(() => {
        const user = users.find(
            (u) => (u.phone === payload.phone) &&
                u.password === payload.password,
        )
        console.log('Login attempt:', payload, 'Found user:', user)

        if (!user) {
            return { message: 'incorrect_credentials' }
        }

        if (!user.isActive) {
            return { message: 'This account has been locked' }
        }

        setUser(user)
        return { user }
    })
}

