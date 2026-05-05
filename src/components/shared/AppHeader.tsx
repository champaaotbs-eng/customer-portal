import { Link, useNavigate } from '@tanstack/react-router'
import { useAuthStore, logout } from '@/store/auth.store'
import { APP_ROUTES } from '@/constants/app-routes'
import { Bus, Globe, Search, Ticket, ChevronDown, LogOut, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect, useState, useRef } from 'react'
import { SUPPORTED_LANGS, DEFAULT_LANG, LANG_STORAGE_KEY, type SupportedLang } from '#/i18n'
import { cn } from '@/lib/utils'

export function AppHeader() {
    const { user, isAuthenticated } = useAuthStore()
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // After hydration, restore the language the user previously selected.
    useEffect(() => {
        const saved = localStorage.getItem(LANG_STORAGE_KEY) as SupportedLang | null
        if (saved && SUPPORTED_LANGS.includes(saved) && saved !== i18n.language) {
            void i18n.changeLanguage(saved)
        }
    }, [])

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    function handleLogout() {
        setMenuOpen(false)
        logout()
        navigate({ to: APP_ROUTES.HOME })
    }

    function toggleLang() {
        const next: SupportedLang = i18n.language === 'vi' ? 'en' : 'vi'
        localStorage.setItem(LANG_STORAGE_KEY, next)
        void i18n.changeLanguage(next)
    }

    const currentLang = SUPPORTED_LANGS.includes(i18n.language as SupportedLang)
        ? (i18n.language as SupportedLang)
        : DEFAULT_LANG

    const navLinks = [
        { label: t('nav.search'), to: APP_ROUTES.CUSTOMER.SEARCH, icon: Search },
        { label: t('nav.my_tickets'), to: APP_ROUTES.CUSTOMER.MY_TICKETS, icon: Ticket },
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 font-extrabold text-primary transition-opacity hover:opacity-80">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Bus className="h-5 w-5" />
                    </div>
                    <span className="text-lg tracking-tight">VéXe.vn</span>
                </Link>

                {/* Center nav links (desktop) */}
                <nav className="mx-auto hidden items-center gap-1 sm:flex">
                    {navLinks.map((link) => {
                        const Icon = link.icon
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                                    '[&.active]:bg-primary/10 [&.active]:text-primary',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="flex-1 sm:flex-none" />

                {/* Language switcher */}
                <button
                    onClick={toggleLang}
                    title={t('lang.switch')}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                    <Globe className="h-4 w-4" />
                    <span className="uppercase">{currentLang}</span>
                </button>

                {/* Auth area */}
                {isAuthenticated && user ? (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen((o) => !o)}
                            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {user.name?.[0]?.toUpperCase() ?? 'U'}
                            </div>
                            <span className="hidden max-w-[120px] truncate sm:inline">{user.name}</span>
                            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', menuOpen && 'rotate-180')} />
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-2 min-w-[180px] rounded-xl border border-border bg-card p-1.5 shadow-xl">
                                <div className="border-b border-border px-3 py-2 mb-1">
                                    <p className="text-xs font-semibold">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{t('roles.customer')}</p>
                                </div>
                                <Link
                                    to={APP_ROUTES.CUSTOMER.MY_TICKETS}
                                    onClick={() => setMenuOpen(false)}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent"
                                >
                                    <Ticket className="h-4 w-4" />
                                    {t('nav.my_tickets')}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {t('nav.logout')}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link
                            to={APP_ROUTES.LOGIN}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                        >
                            {t('nav.login')}
                        </Link>
                        <Link
                            to={APP_ROUTES.REGISTER}
                            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                            {t('nav.register')}
                        </Link>
                    </div>
                )}
            </div>

            {/* Mobile bottom nav */}
            <nav className="flex border-t border-border sm:hidden">
                {navLinks.map((link) => {
                    const Icon = link.icon
                    return (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={cn(
                                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground transition',
                                '[&.active]:text-primary',
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    )
                })}
            </nav>
        </header>
    )
}
