export const APP_ROUTES = {
    HOME: '/',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',

    CUSTOMER: {
        ROOT: '/customer',
        SEARCH: '/customer/search',
        MY_TICKETS: '/customer/my-tickets',
        BOOKING: (tripId: string) => `/customer/booking/${tripId}`,
    },
} as const
