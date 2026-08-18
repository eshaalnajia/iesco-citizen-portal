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
          "flex items-center justify-center w-9 h-9 rounded-lg border",
          "border-slate-200 hover:border-slate-300 bg-white",
          "text-base leading-none transition-colors",
          className
        )}
        aria-label={isUrdu ? "Switch to English" : "???? ??? ??????"}
      >
        {isUrdu ? "????" : "????"}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border",
        "text-sm font-medium transition-colors",
        "border-slate-200 hover:border-slate-300 bg-white",
        "text-slate-600 hover:text-slate-800",
        className
      )}
      aria-label={isUrdu ? "Switch to English" : "???? ??? ??????"}
    >
      <span className="text-base leading-none">{isUrdu ? "????" : "????"}</span>
      <span>{isUrdu ? "English" : "????"}</span>
    </button>
  )
}
