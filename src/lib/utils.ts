import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

//Display order limit
export const DISPLAY_ORDER_LIMIT = 1000;

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateInput: string | Date | number): string {
    if (!dateInput) return "-";

    try {
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return String(dateInput);
        }

        return new Intl.DateTimeFormat("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).format(date);
    } catch (error) {
        console.error("Error formatting date:", error);
        return String(dateInput);
    }
}

export function formatDateOnly(date: Date): string {
    try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error("Error formatting date:", error);
        return "";
    }
}

export function formatDateUTC(dateInput: string | Date | number): string {
    if (!dateInput) return "-";

    try {
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return String(dateInput);
        }

        return new Intl.DateTimeFormat("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour12: false,
        }).format(date);
    } catch (error) {
        console.error("Error formatting date:", error);
        return String(dateInput);
    }
}

export function formatDateWithTimezone(
    dateInput: string | Date | number,
    specifyTimezone: string | null = null
): string {
    if (!dateInput) return "-";
    try {
        const timezone =
            specifyTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (isNaN(date.getTime())) return String(dateInput);

        return new Intl.DateTimeFormat("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: timezone,
            timeZoneName: "shortOffset",
        }).format(date);
    } catch (error) {
        console.error("Error formatting date:", error);
        return String(dateInput);
    }
}

export function formatDateTime(input: string | Date | null): string {
    if (!input) return "";
    let date: Date;

    if (typeof input === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            date = new Date(`${input}T00:00:00`);
        } else {
            date = new Date(input);
        }
    } else {
        date = input;
    }

    if (isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}
export function formatToYYYYMMDD(
    dateInput: string | Date | null | undefined
): string {
    if (!dateInput) return "";
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return dateInput.toString(); // Trả về giá trị gốc nếu không hợp lệ
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function formatDateToReadable(
    dateInput: string | Date | null | undefined
): string {
    if (!dateInput) return "";
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

export function objectSlice(
    obj: object,
    keys: string[],
    rescueValue: null | string = null
): Record<string, unknown> {
    return Object.keys(obj)
        .filter((key) => keys.indexOf(key) >= 0)
        .reduce((acc: Record<string, unknown>, key) => {
            acc[key] = (obj as Record<string, unknown>)[key] || rescueValue;
            return acc;
        }, {});
}

export const processInputChange = (e: any, callback: any) => {
    if (/^(-?)0+(?=\d)/.test(e.target.value)) {
        e.target.value = e.target.value.replace(/^(-?)0+(?=\d)/, "$1");
    }
    callback(e);
};

export function getFlagEmoji(countryCode: string) {
    if (!countryCode) return "";
    return countryCode
        .toUpperCase()
        .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function validatePlanForm({
    plan,
    selectedInsurer,
    selectedClaimTypes,
    fileSource,
    fileTerms,
    fileUrl,
    t,
    selectedPartner,
    isPA,

}: {
    plan: any;
    selectedInsurer: any;
    selectedClaimTypes: any[];
    fileSource: string;
    fileTerms: File | null;
    fileUrl: string;
    t: (key: string, ...args: any[]) => string;
    selectedPartner?: any;
    isPA?: boolean;
}) {
    const errors: { [key: string]: string } = {};
    const MAX_FILE_SIZE_MB = 10;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    const productType = plan?.product_type?.trim()
    const coverage_period = isPA ? plan.coverage_period_value : plan.coverage_period;
    if (!plan.code?.trim()) errors.code = t("plan_code_required");
    if (!plan.name?.trim()) errors.name = t("plan_name_required");
    if (!plan.short_name?.trim()) errors.short_name = t("short_name_required");
    if (!selectedInsurer) errors.insurer = t("insurer_required");
    if (isPA && !selectedPartner) errors.partner = t("partner_required");
    if (!selectedClaimTypes || selectedClaimTypes.length === 0) errors.claim_type = t("claim_type_required");
    if (isPA && !productType) errors.product_type = t("product_type_required");
    if (!plan.master_policy_number?.trim()) errors.master_policy_number = t("membership_number_required");
    if (!plan.description?.trim()) errors.description = t("description_required");
    if (!coverage_period?.trim()) errors.coverage_period_value = t("coverage_period_required");

    if (!plan.claim_limit) errors.claim_limit = t("claim_limit_required");
    if (!plan.deductible_info?.trim()) errors.deductible_info = t("deductible_info_required");
    if (plan.display_order && Number(plan.display_order) > DISPLAY_ORDER_LIMIT) errors.display_order = t('display_order_exceeded_limit', { limit: DISPLAY_ORDER_LIMIT })

    if (fileSource === "upload") {
        if (!fileTerms) {
            errors.file_terms = t("terms_and_conditions_required");
        } else {
            if (fileTerms.type !== "application/pdf") {
                errors.file_terms = t("only_pdf");
            }
            if (fileTerms.size > MAX_FILE_SIZE_BYTES) {
                errors.file_terms = `${t("file_size")} ${MAX_FILE_SIZE_MB}MB.`;
            }
        }
    } else if (fileSource === "url" && !fileUrl?.trim()) {
        errors.file_url = t("enter_url_required");
    }

    return errors;
}

export function calculateCoverageEndDate(tenure: number | null | undefined, tenure_type: string | null | undefined, start_date: Date): {
    end_date: Date
} {
    const end_date = new Date(start_date)

    if (!tenure || !tenure_type) {
        end_date.setFullYear(end_date.getFullYear() + 1)
        return {
            end_date,
        }
    }

    const unit = String(tenure_type).trim().toLowerCase()

    switch (unit) {
        case 'year':
        case 'years':
            end_date.setFullYear(end_date.getFullYear() + tenure)
            break
        case 'month':
        case 'months':
            end_date.setMonth(end_date.getMonth() + tenure)
            break
        case 'day':
        case 'days':
            end_date.setDate(end_date.getDate() + tenure)
            break
        case 'hour':
        case 'hours':
            end_date.setHours(end_date.getHours() + tenure)
            break
        case 'minute':
        case 'minutes':
            end_date.setMinutes(end_date.getMinutes() + tenure)
            break
        default:
            console.warn(`Unknown time unit: "${tenure_type}". Using default 1 year.`)
            end_date.setFullYear(end_date.getFullYear() + 1)
    }

    return {
        end_date
    }
}
