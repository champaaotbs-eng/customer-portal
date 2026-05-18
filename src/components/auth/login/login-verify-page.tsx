import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { AlertCircle, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTranslation } from 'react-i18next'
import { login } from '@/services/auth/login-service'
import { isAuthError } from '@/services/auth.service'
import { sendLoginEmailOtp } from '@/services/auth/customer-auth.api'

export function LoginVerifyPage({ email }: { email: string }) {
    const navigate = useNavigate()
    const { t } = useTranslation('translation', { keyPrefix: 'pages.login' })
    const [otp, setOtp] = useState('')
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

    const loginMutation = useMutation({
        mutationFn: login,
        onSuccess: (result) => {
            if (isAuthError(result)) {
                setFeedbackMessage(result.message ?? t('otp_invalid', { defaultValue: 'The OTP is invalid or expired.' }))
                return
            }

            window.sessionStorage.removeItem('pendingLoginOtpEmail')
            navigate({ to: APP_ROUTES.CUSTOMER.ROOT })
        },
        onError: (error: any) => {
            setFeedbackMessage(error?.localizedMessage || error?.message || t('otp_invalid', { defaultValue: 'The OTP is invalid or expired.' }))
        },
    })

    async function handleResendOtp() {
        const result = await sendLoginEmailOtp(email)
        if (result.message) {
            setFeedbackMessage(result.message)
            return
        }

        setFeedbackMessage(t('otp_sent', { defaultValue: 'OTP sent to your email.' }))
    }

    function handleVerifyOtp() {
        if (!otp.trim()) {
            setFeedbackMessage(t('otp_required', { defaultValue: 'Enter the OTP to continue.' }))
            return
        }

        setFeedbackMessage(null)
        loginMutation.mutate({
            email,
            otp: otp.trim(),
        })
    }

    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
                <div className="mb-6 text-center">
                    <div className="mb-3 flex justify-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <MailCheck className="h-6 w-6 text-primary" />
                        </span>
                    </div>
                    <h1 className="text-2xl font-semibold">{t('verify_title', { defaultValue: 'Verify OTP' })}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {t('verify_desc', { defaultValue: 'We sent a 6-digit OTP to this email address.' })}
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <Input
                        label={t('email_label', { defaultValue: 'Email' })}
                        type="email"
                        value={email}
                        disabled
                    />

                    <Input
                        label={t('otp_label', { defaultValue: 'OTP code' })}
                        value={otp}
                        onChange={(e) => {
                            setOtp(e.target.value)
                            setFeedbackMessage(null)
                        }}
                        placeholder={t('otp_placeholder', { defaultValue: 'Enter the 6-digit code' })}
                        autoComplete="one-time-code"
                    />

                    {feedbackMessage && (
                        <p className="text-xs text-muted-foreground flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {feedbackMessage}
                        </p>
                    )}

                    <Button type="button" loading={loginMutation.isPending} className="w-full" onClick={handleVerifyOtp}>
                        {t('verify_otp', { defaultValue: 'Verify OTP' })}
                    </Button>

                    <Button type="button" variant="outline" className="w-full" onClick={handleResendOtp}>
                        {t('resend_otp', { defaultValue: 'Resend OTP' })}
                    </Button>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    <Link to={APP_ROUTES.LOGIN} className="font-medium text-primary hover:underline">
                        {t('back_to_login', { defaultValue: 'Back to login' })}
                    </Link>
                </p>
            </div>
        </div>
    )
}
