import { useState }       from "react"
import { useTranslation } from "react-i18next"
import { Star }     from "lucide-react"
import { cn }       from "@/lib/utils"

export function StarRating({
  value        = 0,
  max          = 5,
  interactive  = false,
  size         = "sm",
  onSelect,
}) {
  const [hovered, setHovered] = useState(0)

  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const starSize = sizeClasses[size] ?? sizeClasses.sm
  const display  = hovered || value

  return (
    <div
      className={cn("flex items-center gap-0.5", interactive && "cursor-pointer")}
      onMouseLeave={() => interactive && setHovered(0)}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const filled = star <= display
        return (
          <Star
            key={star}
            className={cn(
              starSize,
              "transition-colors",
              filled ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200",
              interactive && "hover:text-amber-300 hover:fill-amber-300",
            )}
            onMouseEnter={() => interactive && setHovered(star)}
            onClick={() => interactive && onSelect?.(star)}
          />
        )
      })}
    </div>
  )
}

const LABEL_KEY_MAP = {
  "Excellent":      "excellent",
  "Very Good":      "veryGood",
  "Good":           "good",
  "Average":        "average",
  "Below Average":  "belowAverage",
}

export function RatingDisplay({ rating, totalReviews, label, size = "sm" }) {
  const { t } = useTranslation()

  if (!rating || !totalReviews) {
    return (
      <span className="text-xs text-slate-400">{t("services.noRatings", "No ratings yet")}</span>
    )
  }

  const labelKey = LABEL_KEY_MAP[label]
  const translatedLabel = labelKey ? t(`services.${labelKey}`, label) : label

  return (
    <div className="flex items-center gap-1.5">
      <StarRating value={rating} size={size} />
      <span className="text-xs font-semibold text-amber-600">
        {Number(rating).toFixed(1)}
      </span>
      {totalReviews && (
        <span className="text-xs text-slate-400">
          ({t("services.reviews", `${totalReviews} ${totalReviews === 1 ? "review" : "reviews"}`, { count: totalReviews })})
        </span>
      )}
      {label && (
        <span className="text-xs text-slate-500 hidden sm:inline">
          - {translatedLabel}
        </span>
      )}
    </div>
  )
}
