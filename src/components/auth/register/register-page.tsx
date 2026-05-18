import { Link, useNavigate } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isAuthError } from '@/services/auth.service'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTranslation } from 'react-i18next'
import type { IRegister } from 'types/auth/register'
import { register } from 'services/auth/register-service'
import { sendCustomerEmailOtp } from '@/services/auth/customer-auth.api'

export function RegisterPage() {
    const navigate = useNavigate()
    const { t } = useTranslation('translation', { keyPrefix: 'pages.register' })
    const [otpRequested, setOtpRequested] = useState(false)
    const [otp, setOtp] = useState('')
    const [otpMessage, setOtpMessage] = useState<string | null>(null)

    const {
        register: reg,
        handleSubmit,
        setError,
        clearErrors,
        watch,
        formState: { errors },
    } = useForm<IRegister>({
        defaultValues: {
            fullName: '',
            email: '',
            phone: '',
            otp: '',
        },
    })
    const watchedEmail = watch('email')

    useEffect(() => {
        setOtpRequested(false)
        setOtp('')
        setOtpMessage(null)
        clearErrors('root')
    }, [watchedEmail])

    function clearFormError() {
        clearErrors('root')
        setOtpMessage(null)
    }


    const registerMutation = useMutation({
        mutationFn: (data: IRegister) => register(data),
        onSuccess: (result) => {
            if (isAuthError(result)) {
                setError('root', { message: result.message })
                return
            }
            navigate({ to: APP_ROUTES.CUSTOMER.SEARCH })
        },
    })

    function onSubmit(data: IRegister) {
        if (!otp.trim()) {
            setError('root', { message: t('otp_required', { defaultValue: 'Verify your email before registering.' }) })
            return
        }
        registerMutation.mutate({ ...data, otp: otp.trim() })
    }

    const serverError = registerMutation.data && isAuthError(registerMutation.data)
        ? registerMutation.data.message
        : errors.root?.message

    async function handleSendOtp() {
        const result = await sendCustomerEmailOtp(watchedEmail)
        if (result.message) {
            setOtpMessage(result.message)
            return
        }

        setOtpRequested(true)
        setOtpMessage(t('otp_sent', { defaultValue: 'OTP sent to your email.' }))
    }

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
                        {...reg('fullName', { onChange: clearFormError })}
                    />
                    <Input
                        label={t('email_label')}
                        type="email"
                        placeholder={t('email_placeholder')}
                        autoComplete="email"
                        required
                        {...reg('email', { onChange: clearFormError })}
                    />
                    <Input
                        label={t('phone_label')}
                        type="tel"
                        placeholder={t('phone_placeholder')}
                        {...reg('phone', { onChange: clearFormError })}
                    />

                    <div className="flex gap-2">
                        <Button type="button" variant="outline" className="w-full" onClick={handleSendOtp}>
                            {t('send_otp', { defaultValue: 'Send OTP' })}
                        </Button>
                    </div>

                    {otpRequested && (
                        <Input
                            label={t('otp_label', { defaultValue: 'OTP code' })}
                            placeholder={t('otp_placeholder', { defaultValue: 'Enter the 6-digit code' })}
                            value={otp}
                            onChange={(e) => {
                                setOtp(e.target.value)
                                clearFormError()
                            }}
                        />
                    )}

                    {otpMessage && (
                        <p className="text-xs text-muted-foreground">{otpMessage}</p>
                    )}

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
