export const ROLES = {
    CUSTOMER: 'customer',
} as const

/** i18n key mapping for role labels — use t(`roles.${ROLE_I18N_KEYS[role]}`) */
export const ROLE_I18N_KEYS: Record<string, string> = {
    customer: 'customer',
}
