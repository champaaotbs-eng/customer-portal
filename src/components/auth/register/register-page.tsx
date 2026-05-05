import { Link, useNavigate } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isAuthError } from '@/services/auth.service'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTranslation } from 'react-i18next'
import type { IRegister } from 'types/auth/register'
import { register } from 'services/auth/register-service'

export function RegisterPage() {
    const navigate = useNavigate()
    const { t } = useTranslation('translation', { keyPrefix: 'pages.register' })
    const { t: tV } = useTranslation('translation', { keyPrefix: 'validations' })

    const {
        register: reg,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<IRegister>({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            password: '',
            confirm: '',
            role: 'customer',
        },
    })


    const registerMutation = useMutation({
        mutationFn: (data: IRegister) => {
            const { confirm: _confirm, ...payload } = data
            return register({ ...payload, role: 'customer' })
        },
        onSuccess: (result) => {
            if (isAuthError(result)) {
                setError('root', { message: result.message })
                return
            }
            navigate({ to: APP_ROUTES.CUSTOMER.SEARCH })
        },
    })

    function onSubmit(data: IRegister) {
        if (data.password !== data.confirm) {
            setError('confirm', { message: tV('password_mismatch') })
            return
        }
        if (data.password.length < 6) {
            setError('password', { message: tV('password_min_length', { min: 6 }) })
            return
        }
        registerMutation.mutate(data)
    }

    const serverError = registerMutation.data && isAuthError(registerMutation.data)
        ? registerMutation.data.message
        : errors.root?.message

    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
                <div className="mb-6 text-center">
                    <div className="mb-3 flex justify-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <UserPlus className="h-6 w-6 text-primary" />
                        </span>
                    </div>
                    <h1 className="text-2xl font-semibold">{t('title')}</h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <Input
                        label={t('full_name_label')}
                        placeholder={t('full_name_placeholder')}
                        required
                        {...reg('name')}
                    />
                    <Input
                        label={t('email_label')}
                        type="email"
                        placeholder={t('email_placeholder')}
                        autoComplete="email"
                        required
                        {...reg('email')}
                    />
                    <Input
                        label={t('phone_label')}
                        type="tel"
                        placeholder={t('phone_placeholder')}
                        {...reg('phone')}
                    />
                    <Input
                        label={t('password_label')}
                        type="password"
                        placeholder={t('password_placeholder')}
                        autoComplete="new-password"
                        required
                        {...reg('password')}
                    />
                    <div>
                        <Input
                            label={t('confirm_password_label')}
                            type="password"
                            placeholder={t('confirm_password_placeholder')}
                            autoComplete="new-password"
                            required
                            {...reg('confirm')}
                        />
                        {errors.confirm && (
                            <p className="mt-1 text-xs text-destructive">{errors.confirm.message}</p>
                        )}
                        {errors.password && (
                            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
                        )}
                    </div>

                    {serverError && (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {serverError}
                        </p>
                    )}

                    <Button type="submit" loading={registerMutation.isPending} className="mt-2 w-full">
                        {t('register_btn')}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    {t('have_account')}{' '}
                    <Link to={APP_ROUTES.LOGIN} className="font-medium text-primary hover:underline">
                        {t('login_here')}
                    </Link>
                </p>
            </div>
        </div>
    )
}
