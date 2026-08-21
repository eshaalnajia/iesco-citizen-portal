import { useTranslation } from "react-i18next"
import { cn }             from "@/lib/utils"

export function LanguageSwitcher({ className, compact = false }) {
  const { i18n } = useTranslation()
  const isUrdu   = i18n.language === "ur"

  function toggle() {
    i18n.changeLanguage(isUrdu ? "en" : "ur")
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        className={cn(
          "flex items-center justify-center h-9 px-3 rounded-lg border shrink-0",
          "border-slate-200 hover:border-slate-300 bg-white dark:bg-card text-slate-600 dark:text-muted-foreground",
          "text-sm font-medium leading-none transition-colors",
          className
        )}
        aria-label={isUrdu ? "Switch to English" : "اردو میں تبدیل کریں"}
      >
        {isUrdu ? "EN" : "اردو"}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border",
        "text-sm font-medium transition-colors",
        "border-slate-200 hover:border-slate-300 bg-white dark:bg-card",
        "text-slate-600 dark:text-muted-foreground hover:text-slate-800 dark:text-foreground",
        className
      )}
      aria-label={isUrdu ? "Switch to English" : "???? ??? ??????"}
    >
      <span className="text-base leading-none">{isUrdu ? "EN" : "اردو"}</span>
      <span>{isUrdu ? "English" : "اردو"}</span>
    </button>
  )
}
