import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { MapPin, Clock, ShieldCheck, Ticket, ArrowRight, Star, ChevronRight, Bus, Search, Users } from 'lucide-react'
import { APP_ROUTES } from '@/constants/app-routes'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

const FEATURE_ICONS = [MapPin, Clock, ShieldCheck, Ticket]

const POPULAR_ROUTES = [
    { from: 'Hà Nội', to: 'TP. Hồ Chí Minh', duration: '~30 giờ', price: '350.000' },
    { from: 'TP. Hồ Chí Minh', to: 'Đà Lạt', duration: '~7 giờ', price: '180.000' },
    { from: 'Hà Nội', to: 'Đà Nẵng', duration: '~14 giờ', price: '250.000' },
    { from: 'TP. Hồ Chí Minh', to: 'Nha Trang', duration: '~8 giờ', price: '200.000' },
    { from: 'Hà Nội', to: 'Sapa', duration: '~6 giờ', price: '150.000' },
    { from: 'TP. Hồ Chí Minh', to: 'Cần Thơ', duration: '~3 giờ', price: '120.000' },
]

const TESTIMONIALS = [
    { name: 'Nguyễn Minh Tuấn', rating: 5, text: 'Đặt vé nhanh, dễ dùng. Tôi đã đặt nhiều lần và chưa bao giờ gặp vấn đề!', avatar: 'T' },
    { name: 'Trần Thị Lan', rating: 5, text: 'Giao diện thân thiện, tìm chuyến xe rất tiện lợi. Giá vé cũng hợp lý.', avatar: 'L' },
    { name: 'Lê Văn Hùng', rating: 4, text: 'Dịch vụ tốt, nhiều lựa chọn nhà xe. Mình thích nhất là có thể lọc theo giờ khởi hành.', avatar: 'H' },
]

export function LandingPage() {
    const { t } = useTranslation('translation', { keyPrefix: 'pages.homepage' })
    const [activeTab, setActiveTab] = useState<'one_way' | 'round_trip'>('one_way')

    const features = [
        { icon: FEATURE_ICONS[0], title: t('feat1_title'), desc: t('feat1_desc'), color: 'bg-blue-50 text-blue-600' },
        { icon: FEATURE_ICONS[1], title: t('feat2_title'), desc: t('feat2_desc'), color: 'bg-orange-50 text-orange-600' },
        { icon: FEATURE_ICONS[2], title: t('feat3_title'), desc: t('feat3_desc'), color: 'bg-green-50 text-green-600' },
        { icon: FEATURE_ICONS[3], title: t('feat4_title'), desc: t('feat4_desc'), color: 'bg-purple-50 text-purple-600' },
    ]

    return (
        <div className="overflow-x-hidden">
            {/* ── Hero ── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 pb-28 pt-16 text-white">
                {/* Background decorations */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5" />
                    <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5" />
                    <div className="absolute left-1/2 top-0 h-px w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>

                <div className="relative mx-auto max-w-5xl px-4 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                        {t('trusted_badge')}
                    </div>
                    <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                        {t('hero_title')}{' '}
                        <span className="relative inline-block">
                            <span className="relative z-10">{t('hero_highlight')}</span>
                            <span className="absolute bottom-0 left-0 right-0 h-3 -rotate-1 bg-yellow-400/40 blur-sm" />
                        </span>
                    </h1>
                    <p className="mx-auto mb-10 max-w-2xl text-lg text-white/80">{t('hero_desc')}</p>

                    {/* Stats bar */}
                    <div className="mb-10 flex flex-wrap justify-center gap-8">
                        {[
                            { icon: Bus, value: '500+', label: t('stat_companies') },
                            { icon: MapPin, value: '200+', label: t('stat_routes') },
                            { icon: Users, value: '1M+', label: t('stat_customers') },
                        ].map((stat) => {
                            const Icon = stat.icon
                            return (
                                <div key={stat.label} className="flex items-center gap-2 text-white/90">
                                    <Icon className="h-5 w-5 text-yellow-300" />
                                    <strong className="text-xl font-bold">{stat.value}</strong>
                                    <span className="text-sm text-white/70">{stat.label}</span>
                                </div>
                            )
                        })}
                    </div>

                    {/* CTA */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/20">
                            <Link to={APP_ROUTES.CUSTOMER.SEARCH} className="flex items-center gap-2">
                                <Search className="h-4 w-4" />
                                {t('search_btn')}
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">
                            <Link to={APP_ROUTES.REGISTER}>{t('register_btn')}</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* ── Popular Routes ── */}
            <section className="mx-auto max-w-5xl -translate-y-6 px-4">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/5">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-lg font-bold">{t('popular_routes')}</h2>
                        <Link
                            to={APP_ROUTES.CUSTOMER.SEARCH}
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                            {t('view_all')} <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {POPULAR_ROUTES.map((route) => (
                            <Link
                                key={`${route.from}-${route.to}`}
                                to={APP_ROUTES.CUSTOMER.SEARCH}
                                className="group flex items-center justify-between rounded-xl border border-border bg-background p-4 transition hover:border-primary/40 hover:bg-primary/5"
                            >
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                                        <span>{route.from}</span>
                                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                                        <span>{route.to}</span>
                                    </div>
                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {route.duration}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">{t('from_price')}</p>
                                    <p className="font-bold text-primary">{route.price}đ</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="mx-auto max-w-5xl px-4 pb-20 pt-6">
                <div className="mb-10 text-center">
                    <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">{t('why_badge')}</p>
                    <h2 className="text-3xl font-bold">{t('why_choose')}</h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((f) => {
                        const Icon = f.icon
                        return (
                            <div
                                key={f.title}
                                className="group rounded-2xl border border-border bg-card p-6 text-center transition hover:border-primary/30 hover:shadow-md"
                            >
                                <div className="mb-4 flex justify-center">
                                    <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${f.color} transition-transform group-hover:scale-110`}>
                                        <Icon className="h-7 w-7" />
                                    </span>
                                </div>
                                <h3 className="mb-2 font-bold">{f.title}</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="bg-muted/40 py-20">
                <div className="mx-auto max-w-5xl px-4">
                    <div className="mb-12 text-center">
                        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">{t('how_badge')}</p>
                        <h2 className="text-3xl font-bold">{t('how_title')}</h2>
                    </div>
                    <div className="grid gap-8 sm:grid-cols-3">
                        {[
                            { step: '01', icon: Search, title: t('step1_title'), desc: t('step1_desc') },
                            { step: '02', icon: MapPin, title: t('step2_title'), desc: t('step2_desc') },
                            { step: '03', icon: Ticket, title: t('step3_title'), desc: t('step3_desc') },
                        ].map((item, idx) => {
                            const Icon = item.icon
                            return (
                                <div key={item.step} className="relative text-center">
                                    {idx < 2 && (
                                        <div className="absolute left-full top-8 hidden h-px w-full -translate-y-1/2 border-t-2 border-dashed border-border sm:block" style={{ width: 'calc(100% - 4rem)', left: 'calc(50% + 2rem)' }} />
                                    )}
                                    <div className="relative mb-4 flex justify-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                            <Icon className="h-7 w-7 text-primary" />
                                        </div>
                                        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                                            {idx + 1}
                                        </span>
                                    </div>
                                    <h3 className="mb-2 font-bold">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="mx-auto max-w-5xl px-4 py-20">
                <div className="mb-12 text-center">
                    <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">{t('reviews_badge')}</p>
                    <h2 className="text-3xl font-bold">{t('reviews_title')}</h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-3">
                    {TESTIMONIALS.map((review) => (
                        <div key={review.name} className="rounded-2xl border border-border bg-card p-6">
                            <div className="mb-3 flex gap-0.5">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">"{review.text}"</p>
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                    {review.avatar}
                                </div>
                                <span className="text-sm font-semibold">{review.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 py-20 text-white">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
                    <div className="absolute -bottom-8 left-1/4 h-40 w-40 rounded-full bg-white/5" />
                </div>
                <div className="relative mx-auto max-w-2xl px-4 text-center">
                    <p className="mb-2 text-sm font-medium uppercase tracking-wide text-white/70">
                        {t('for_company')}
                    </p>
                    <h2 className="mb-4 text-3xl font-bold">{t('cta_title')}</h2>
                    <p className="mb-8 text-white/70">{t('cta_desc')}</p>
                    <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
                        <Link to={APP_ROUTES.REGISTER} className="flex items-center gap-2">
                            {t('cta_btn')} <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    )
}
