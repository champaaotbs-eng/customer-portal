export interface IRegister {
    name: string
    username: string
    email: string
    phone: string
    password: string
    confirm: string
    role: 'customer' // fixed role for registration
}