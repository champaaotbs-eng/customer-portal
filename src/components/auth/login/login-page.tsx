import { Link, useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { AlertCircle, LogIn as LoginIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTranslation } from 'react-i18next'
import { loginValidationSchema } from './validation-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { sendLoginEmailOtp } from '@/services/auth/customer-auth.api'

export function LoginPage() {
    const navigate = useNavigate()
    const { t } = useTranslation('translation', { keyPrefix: 'pages.login' })

    const schema = loginValidationSchema(t)

    const { control, handleSubmit, getValues, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<{ email: string }>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: '',
        },
        mode: 'onChange',
        reValidateMode: 'onChange',
    })

    async function onSubmit() {
        clearErrors('root')
        const email = getValues('email').trim().toLowerCase()
        const result = await sendLoginEmailOtp(email)
        if (result.message) {
            setError('root', { message: result.message })
            return
        }
        if (!result.sent) {
            setError('root', { message: t('otp_send_failed', { defaultValue: 'Failed to send OTP to this email address.' }) })
            return
        }

        window.sessionStorage.setItem('pendingLoginOtpEmail', email)

        navigate({
            to: APP_ROUTES.LOGIN_VERIFY,
            search: {
                email,
            },
        })
    }

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

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                onChange={(event) => {
                                    field.onChange(event)
                                    clearErrors('root')
                                }}
                                label={t('email_label', { defaultValue: 'Email' })}
                                type="email"
                                placeholder={t('email_placeholder', { defaultValue: 'you@example.com' })}
                                autoComplete="email"
                            />
                        )}
                    />
                    {errors.email && (
                        <p className="text-red-500 text-xs flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.email.message}
                        </p>
                    )}
                    {errors.root?.message && (
                        <p className="text-red-500 text-xs flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.root.message}
                        </p>
                    )}

                    <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
                        {t('send_otp', { defaultValue: 'Send OTP' })}
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
