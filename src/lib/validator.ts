import { z } from "zod"
import mime from "mime-types"

interface ValidationRules {
    required?: boolean,
    minLength?: number,
    maxLength?: number,
    pattern?: string,
    accept?: string
}

interface ICustomMessages {
    required?: string,
    minLength?: string,
    maxLength?: string,
    invalidFormat?: string,
    invalidEmail?: string,
    mustBeNumber?: string,
    mustBeDate?: string,
}

interface FieldSetting extends ValidationRules {
    type?: string,
    ariaLabel?: string,
    skipValidation?: boolean,
    customMessages?: ICustomMessages
}

export function useValidator(translator: any, fieldSetting: FieldSetting) {
    let constraints = []
    const { type, ariaLabel, customMessages } = fieldSetting
    const commonFieldName = () => {
        switch (type) {
            case "file": return translator("common_file_field_name")
            default: return translator("common_field_name")
        }
    }
    const fieldName = ariaLabel ?? commonFieldName()

    const initSchema = () => {
        switch (type) {
            case "string": return z.string()
            case "number": return z.number()
            case "email": return z.string().email({ message: customMessages?.invalidEmail ?? translator("invalid_email", { fieldName }) })
            case "date": return z.date().nullable().optional()
            case "boolean": return z.boolean()
            case "file": return z.union([z.instanceof(File), z.null()])
            default: return z.string()
        }
    }

    // Begin: Required
    const schemaRequired = (schema: any) => {
        switch (type) {
            case "string":
                return z.string().min(1, { message: customMessages?.required ?? translator("required", { fieldName }) })
            case "number":
                return z.number({
                    required_error: customMessages?.required ?? translator("required", { fieldName }),
                    invalid_type_error: customMessages?.mustBeNumber ?? translator("must_be_number", { fieldName }),
                })
            case "date":
                return z.date({
                    required_error: customMessages?.required ?? translator("required", { fieldName }),
                    invalid_type_error: customMessages?.mustBeDate ?? translator("must_be_date", { fieldName })
                })
            case "file":
                return z.custom<File>((file) => file instanceof File && file.size > 0, {
                    message: customMessages?.required ?? translator("required", { fieldName }),
                })
            default:
                return schema.min(1, customMessages?.required ?? translator("required", { fieldName }))
        }
    }

    const createValidationSchema = (validationRules: ValidationRules) => {
        let baseSchema = initSchema()
        const { required, minLength, maxLength, pattern, accept } = validationRules
        if (required) constraints.push((schema: z.ZodString) => schemaRequired(schema))
        if (minLength) constraints.push((schema: z.ZodString) => schema.min(minLength, customMessages?.minLength ?? translator("min_length", { fieldName, min: minLength })))
        if (maxLength) constraints.push((schema: z.ZodString) => schema.max(maxLength, customMessages?.maxLength ?? translator("max_length", { fieldName, max: maxLength })))
        if (pattern) constraints.push((schema: z.ZodString) => schema.refine((val) => {
            if (!val) return true
            return RegExp(pattern).test(val)
        }, { message: customMessages?.invalidFormat ?? translator("invalid_format", { fieldName }) }))
        if (accept) constraints.push((schema: z.ZodString) => schema.refine(
            (file) => {
                if (!Boolean(file)) return true
                return accept.includes((file as unknown as File)?.type)
            },
            { message: translator("invalid_file_type", { accept: [...new Set(accept.split(',').map((m) => mime.extension(m)).filter(Boolean))].join(', ') }) }
        ))
        return constraints.reduce((acc, fn) => fn(acc as any), baseSchema)
    }

    const validationSchema = createValidationSchema(fieldSetting)

    const isValidatable = () => constraints.length > 0
    const getDataByType = (value: any) => {
        switch (type) {
            case "number": return Number(value)
            case "boolean": return Boolean(value)
            case "date": return new Date(value)
            default: return value
        }
    }
    const validate = (data: any) => {
        const result = validationSchema.safeParse(getDataByType(data))
        if (result.success) return { success: true }
        return {
            success: false,
            errors: result.error.issues.map(issue => issue.message)
        }
    }

    return {
        isValidatable,
        validate
    }
}
