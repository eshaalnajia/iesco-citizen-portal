import { useTranslation } from "react-i18next"
import { BadgeCheck } from "lucide-react"

export function VerifiedBadge({ size = "sm" }) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium
                     text-iesco-teal bg-iesco-teal/10 border border-iesco-teal/20
                     px-1.5 py-0.5 rounded-full">
      <BadgeCheck className="h-3 w-3" />
      {size !== "xs" && t("services.verified", "IESCO Verified")}
    </span>
  )
}
