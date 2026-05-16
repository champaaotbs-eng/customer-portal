import axios from "axios";
import i18n from '@/i18n'
// import { refresh } from "services/auth/auth.service";
import { authStore, logout } from "store/auth.store";
// import { customerAuthStore, logoutCustomer } from "store/customer-auth.store";

const rawBaseUrl = String(
    import.meta.env.VITE_BASE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? '',
).replace(/\/+$/, '')
export const BASE_API_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`

export const instance = axios.create({
    baseURL: BASE_API_URL,
    timeout: 10000,
    withCredentials: true,
});

const resolveErrorKey = (error: any): string | null => {
    const message = error?.response?.data?.message

    if (typeof message === 'string' && message.length > 0) {
        return message
    }

    if (Array.isArray(message)) {
        const firstString = message.find((item) => typeof item === 'string' && item.length > 0)
        return firstString ?? null
    }

    return null
}

const resolveLocalizedMessage = (error: any) => {
    const status = error?.response?.status
    const key = resolveErrorKey(error)

    if (key && i18n.exists(`errors.${key}`)) {
        return i18n.t(`errors.${key}`)
    }

    if (key) {
        return key
    }

    if (status === 401) {
        return i18n.t('errors.unauthorized')
    }

    return i18n.t('errors.internal_server_error')
}

instance.interceptors.request.use(
    function (config) {
        // const adminToken = authStore.state.accessToken
        // // const customerToken = customerAuthStore.state.accessToken
        // const token = adminToken ?? customerToken
        // if (token) {
        //     config.headers['Authorization'] = `Bearer ${token}`
        // }
        return config;
    },
    function (error) {
        return Promise.reject(error);
    },
);

// Add a response interceptor
instance.interceptors.response.use(
    function (response) {
        if (response?.data) return response?.data

        return response;
    },
    async function (error) {
        // Any status codes that fall outside the range of 2xx cause this function to trigger
        // Do something with response error
        const status = error?.response?.status
        const requestUrl = String(error?.config?.url ?? '')
        const isAuthEndpoint = requestUrl.includes('/v1/auth/admin/login') || requestUrl.includes('/v1/auth/refresh')

        error.localizedMessage = resolveLocalizedMessage(error)

        if (status === 401 && !isAuthEndpoint) {
            const isCustomerRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/customer')
            try {
                // await refresh()
            } catch {
                if (isCustomerRoute) {
                    // logoutCustomer()
                    if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
                        window.location.assign('/auth/login')
                    }
                } else {
                    logout()
                    if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
                        window.location.assign('/auth/login')
                    }
                }
            }
        }

        return Promise.reject(error);
    },
);

export const api = {
    get: <T>(...args: Parameters<typeof instance.get>): Promise<IResponse<T>> =>
        instance.get<any, IResponse<T>>(...args),

    post: <T>(...args: Parameters<typeof instance.post>): Promise<IResponse<T>> =>
        instance.post<any, IResponse<T>>(...args),

    put: <T>(...args: Parameters<typeof instance.put>): Promise<IResponse<T>> =>
        instance.put<any, IResponse<T>>(...args),

    patch: <T>(...args: Parameters<typeof instance.patch>): Promise<IResponse<T>> =>
        instance.patch<any, IResponse<T>>(...args),

    delete: <T>(...args: Parameters<typeof instance.delete>): Promise<IResponse<T>> =>
        instance.delete<any, IResponse<T>>(...args),
}
