import { Link, useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { AlertCircle, LogIn as LoginIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isAuthError, type LoginPayload } from '@/services/auth.service'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTranslation } from 'react-i18next'
import { loginValidationSchema } from './validation-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { login } from 'services/auth/login-service'
import type { ILogin } from 'types/auth/login'

export function LoginPage() {
    const navigate = useNavigate()
    const { t } = useTranslation('translation', { keyPrefix: 'pages.login' })

    const schema = loginValidationSchema(t)

    const { control, handleSubmit, formState: { errors } } = useForm<ILogin>({
        resolver: zodResolver(schema),
        defaultValues: {
            phone: '',
            password: ''
        },
        mode: 'onChange',
        reValidateMode: 'onChange',
    })

    const loginMutation = useMutation({
        mutationFn: login,
        onSuccess: (result) => {
            if (isAuthError(result)) return
            navigate({ to: APP_ROUTES.CUSTOMER.ROOT })
        },
    })

    const errorMessage = loginMutation.data && isAuthError(loginMutation.data)
        ? loginMutation.data.message
        : null

    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
                <div className="mb-6 text-center">
                    <div className="mb-3 flex justify-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <LoginIcon className="h-6 w-6 text-primary" />
                        </span>
                    </div>
                    <h1 className="text-2xl font-semibold">{t('title')}</h1>
                </div>

                <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="flex flex-col gap-4">
                    <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label={t('phone_label')}
                                type="tel"
                                placeholder={t('phone_placeholder')}
                                autoComplete="tel"
                            />
                        )}
                    />
                    {errors.phone && (
                        <p className="text-red-500 text-xs flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.phone.message}
                        </p>
                    )}

                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label={t('password_label')}
                                type="password"
                                placeholder={t('password_placeholder')}
                                autoComplete="current-password"
                            />
                        )}
                    />
                    {errors.password && (
                        <p className="text-red-500 text-xs flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.password.message}
                        </p>
                    )}

                    {errorMessage && (
                        <p className="text-red-500 text-xs flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errorMessage}
                        </p>
                    )}

                    <Button type="submit" loading={loginMutation.isPending} className="mt-2 w-full">
                        {t('login_btn')}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    {t('no_account')}{' '}
                    <Link to={APP_ROUTES.REGISTER} className="font-medium text-primary hover:underline">
                        {t('register_here')}
                    </Link>
                </p>
            </div>
        </div>
    )
}
