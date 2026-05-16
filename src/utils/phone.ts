export function normalizeVietnamesePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '')

    if (!digits) {
        throw new Error('invalid_phone')
    }

    let normalized = digits

    if (normalized.startsWith('84')) {
        normalized = `0${normalized.slice(2)}`
    } else if (!normalized.startsWith('0')) {
        normalized = `0${normalized}`
    }

    if (!/^0\d{9,10}$/.test(normalized)) {
        throw new Error('invalid_phone')
    }

    return normalized
}

export function toFirebasePhoneNumber(phone: string): string {
    const normalized = normalizeVietnamesePhone(phone)
    return `+84${normalized.slice(1)}`
}
