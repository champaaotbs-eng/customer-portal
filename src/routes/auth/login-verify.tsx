import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginVerifyPage } from '@/components/auth/login/login-verify-page'
import { APP_ROUTES } from '@/constants/app-routes'

export const Route = createFileRoute('/auth/login-verify')({
    validateSearch: (search: Record<string, unknown>) => ({
        email: (search.email as string) ?? '',
    }),
    beforeLoad: ({ search }) => {
        const storedEmail = typeof window !== 'undefined'
            ? window.sessionStorage.getItem('pendingLoginOtpEmail')
            : null
        if (!search.email && !storedEmail) {
            throw redirect({ to: APP_ROUTES.LOGIN })
        }
    },
    component: LoginVerifyRoute,
})

function LoginVerifyRoute() {
    const search = Route.useSearch()
    const storedEmail = typeof window !== 'undefined'
        ? window.sessionStorage.getItem('pendingLoginOtpEmail')
        : null
    return <LoginVerifyPage email={search.email || storedEmail || ''} />
}
