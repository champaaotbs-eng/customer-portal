import i18n from '@/i18n'

/**
 * Get the current locale from i18n
 */
function getLocale(): string {
    return i18n.language === 'vi' ? 'vi-VN' : 'en-US'
}

/**
 * Format a number as Vietnamese Dong (VND)
 */
export function formatVnd(amount: number): string {
    return new Intl.NumberFormat(getLocale(), {
        style: 'currency',
        currency: 'VND',
    }).format(amount)
}

/**
 * Format ISO date string to localized date/time
 */
export function formatDate(iso: string, withTime = false): string {
    const date = new Date(iso)
    const opts: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(withTime && { hour: '2-digit', minute: '2-digit' }),
    }
    return date.toLocaleDateString(getLocale(), opts)
}

/**
 * Format duration in minutes to "Xh Ym"
 */
export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m} ${i18n.t('common.minutes')}`
    if (m === 0) return `${h}h`
    return i18n.t('common.duration_format', { h, m })
}

/**
 * Get time string "HH:mm" from ISO date
 */
export function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(getLocale(), {
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Slugify text for URL
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFC')
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
}
