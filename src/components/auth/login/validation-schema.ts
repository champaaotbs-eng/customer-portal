import { PASSWORD_REGEX, PHONE_REGEX } from "constants/regex";
import z from "zod";

export const loginValidationSchema = (t: (key: string) => string) => (
    z.object({
        phone: z.string({ required_error: t("errors.phone_required") })
            .regex(PHONE_REGEX, t("errors.invalid_phone")),
        password: z.string({ required_error: t("errors.password_required") })
            .regex(PASSWORD_REGEX, t("errors.invalid_password")),
    })
)