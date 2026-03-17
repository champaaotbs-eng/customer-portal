import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

export const useLogin = () => {
    const navigate = useNavigate()
    const { t } = useTranslation('pages.auth.login')


}