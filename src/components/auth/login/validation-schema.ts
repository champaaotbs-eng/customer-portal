import z from "zod";

export const loginValidationSchema = (t: (key: string) => string) => (
    z.object({
        email: z
            .string({ required_error: t("errors.email_required") })
            .email(t("errors.invalid_email")),
    })
)
