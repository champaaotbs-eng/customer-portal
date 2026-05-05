import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Search, MapPin, Clock, Bus, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

export function LandingPage() {
    const { t } = useTranslation('translation', { keyPrefix: 'pages.homepage' })
    const navigate = useNavigate()
    const today = new Date().toISOString().split('T')[0]

    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')
    const [date, setDate] = useState(today)

    function swap() {
        const tmp = from
        setFrom(to)
        setTo(tmp)
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        if (!from || !to || !date) return
        navigate({ to: '/customer/search', search: { from, to, date } })
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
            {/* Brand */}
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Bus className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t('hero_title')}</h1>
                <p className="max-w-md text-muted-foreground">{t('hero_desc')}</p>
            </div>

            {/* Search card */}
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-md">
                <div className="border-b border-border bg-primary/5 px-6 py-4">
                    <p className="font-semibold text-sm text-muted-foreground">{t('search_label')}</p>
                </div>

                <form onSubmit={handleSearch} className="p-6 space-y-5">
                    {/* From / To */}
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-1.5">
                            <label className="flex items-center gap-1.5 text-sm font-semibold">
                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                {t('from')}
                            </label>
                            <input
                                type="text"
                                required
                                value={from}
                                onChange={e => setFrom(e.target.value)}
                                placeholder={t('from_placeholder')}
                                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={swap}
                            title={t('swap')}
                            className="hidden self-center rounded-xl border border-border bg-background p-2.5 text-muted-foreground transition hover:bg-primary hover:text-primary-foreground hover:border-primary sm:block"
                        >
                            <ArrowLeftRight className="h-4 w-4" />
                        </button>

                        <div className="flex-1 space-y-1.5">
                            <label className="flex items-center gap-1.5 text-sm font-semibold">
                                <MapPin className="h-3.5 w-3.5 text-destructive" />
                                {t('to')}
                            </label>
                            <input
                                type="text"
                                required
                                value={to}
                                onChange={e => setTo(e.target.value)}
                                placeholder={t('to_placeholder')}
                                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-sm font-semibold">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {t('date')}
                        </label>
                        <input
                            type="date"
                            required
                            min={today}
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <Button type="submit" size="lg" className="w-full gap-2">
                        <Search className="h-4 w-4" />
                        {t('search_btn')}
                    </Button>
                </form>
            </div>
        </div>
    )
}
