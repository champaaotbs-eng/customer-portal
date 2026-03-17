import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideCircleAlert } from "lucide-react";
import { useValidator } from "@/lib/validator";
import { useValidationContext } from "@/shared/contexts/validation-context";
import { useFileMap } from "@/shared/contexts/files-context";
import { useTranslation } from "react-i18next";

export const formatNumber = (value: string, locale: string = "en-US") => {
    if (value === "") return "";

    if (value.endsWith(".")) {
        const intPart = value.slice(0, -1);
        return intPart ? Number(intPart).toLocaleString(locale) + "." : ".";
    }

    const [intPart, decimalPart] = value.split(".");
    const formattedInt = intPart ? Number(intPart).toLocaleString(locale) : "";

    return decimalPart !== undefined
        ? `${formattedInt}.${decimalPart}`
        : formattedInt;
};

export const parseNumber = (value: string) => value.replace(/,/g, "");

interface InputProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onError"
> {
    label?: string;
    ariaLabel?: string;
    onError?: (errors: string[]) => void;
    customMessages?: Record<string, string>;
    formatNumber?: boolean;
    file?: File | null;
    locale?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
    const {
        id,
        className,
        type,
        required,
        minLength,
        maxLength,
        pattern,
        accept,
        label,
        ariaLabel,
        onChange,
        onError,
        customMessages,
        formatNumber: shouldFormatNumber,
        value,
        file,
        locale,
        ...restProps
    } = props;

    const internalRef = React.useRef<HTMLInputElement>(null);

    const [displayValue, setDisplayValue] = React.useState("");
    const [errors, setErrors] = React.useState<string[]>([]);
    const [fileName, setFileName] = React.useState("");

    const { t } = useTranslation("validations");
    const { fileMapRef } = useFileMap();

    const { isValidatable, validate } = useValidator(t, {
        type,
        ariaLabel,
        required,
        minLength,
        maxLength,
        pattern,
        accept,
        customMessages,
    });

    React.useEffect(() => {
        if (type === "number" && shouldFormatNumber) {
            if (value !== undefined && value !== null && value !== "") {
                const raw = String(value);
                setDisplayValue(formatNumber(raw, locale));
            } else {
                setDisplayValue("");
            }
        }
    }, [value, type, shouldFormatNumber, locale]);

    React.useEffect(() => {
        const fileValue = file && type === "file" ? file.name : ""
        setFileName(fileValue);
    }, [file, type]);

    const validateCurrentValue = (val?: any) => {
        let v = val;

        if (v === undefined) {
            if (type === "file") {
                v = (id ? fileMapRef?.current?.get(id) : undefined) ?? null;
            } else {
                v = internalRef.current?.value;
            }
        }

        if (!isValidatable()) return true;

        const result = validate(v);
        if (result.success) {
            setErrors([]);
            onError?.([]);
            return true;
        }

        const uniq = Array.from(new Set(result.errors));
        setErrors(uniq);
        onError?.(uniq);
        return false;
    };

    if (isValidatable()) {
        const { registerValidator } = useValidationContext();
        React.useEffect(() => {
            const unregister = registerValidator(validateCurrentValue);
            return unregister;
        }, []);
    }

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (type === "number" && shouldFormatNumber) {
            const raw = parseNumber(e.target.value);

            if (!/^\d*\.?\d*$/.test(raw)) return;

            setDisplayValue(formatNumber(raw));

            onChange?.({
                ...e,
                target: {
                    ...e.target,
                    value: raw,
                },
            } as React.ChangeEvent<HTMLInputElement>);

            validateCurrentValue(raw);
            return;
        }

        onChange?.(e);
        validateCurrentValue();
    };

    /* ================= FILE ================= */

    if (type === "file") {
        return (
            <div className={cn("flex flex-col", className)}>
                <div className="flex items-center h-10 border rounded-md">
                    <button
                        type="button"
                        className="px-3 text-sm font-semibold"
                        onClick={() => { if (ref && 'current' in ref) ref.current?.click(); }}
                    >
                        {t("choose_file")}
                    </button>
                    <span className="flex-1 truncate text-sm px-2">
                        {fileName || t("no_file_chosen")}
                    </span>
                    <input
                        type="file"
                        hidden
                        ref={ref}
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;

                            if (file) {
                                if (id) fileMapRef?.current?.set(id, file);
                                setFileName(file.name);
                            } else {
                                if (id) fileMapRef?.current?.delete(id);
                                setFileName("");
                            }

                            onChange?.(e);

                            validateCurrentValue(file);
                        }}
                        {...restProps}
                    />
                </div>

                {errors.map((err, i) => (
                    <p key={i} className="text-red-500 text-xs mt-1 flex items-center">
                        <LucideCircleAlert className="mr-1 size-3" />
                        {err}
                    </p>
                ))}
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col gap-1", className)}>
            {label && (
                <label className="text-sm font-medium leading-none">
                    {label}{required && <span className="ml-0.5 text-destructive">*</span>}
                </label>
            )}
            <input
                ref={internalRef}
                type={type === "number" && shouldFormatNumber ? "text" : type}
                value={shouldFormatNumber ? displayValue : value}
                onChange={handleOnChange}
                aria-label={ariaLabel ?? label}
                className="min-h-10 h-10 w-full rounded-md border px-3 py-2 text-sm"
                {...restProps}
            />

            {errors.map((err, i) => (
                <p key={i} className="text-red-500 text-xs mt-1 flex items-center">
                    <LucideCircleAlert className="mr-1 size-3" />
                    {err}
                </p>
            ))}
        </div>
    );
});

Input.displayName = "Input";
export { Input };
