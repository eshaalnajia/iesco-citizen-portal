import i18n from "@/i18n/index.js"

/**
 * Formats a PKR amount with locale-appropriate number formatting.
 * English: PKR 17,059.19
 * Urdu:    17,059 روپے (Latin digits for readability on Pakistani phones)
 */
export function formatPKR(amount) {
  if (amount == null || isNaN(amount)) return "-"
  const locale = i18n.language === "ur" ? "en-PK" : "en-PK"
  // Both use en-PK for number format - Urdu label comes from translation
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${i18n.t("common.pkr")} ${formatted}`
}

/**
 * Formats a date in the user's language.
 */
export function formatDate(isoString) {
  if (!isoString) return "-"
  const locale = i18n.language === "ur" ? "ur-PK" : "en-PK"
  return new Date(isoString).toLocaleDateString(locale, {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  })
}

/**
 * Formats a relative time ("3 minutes ago", "ابھی").
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return "-"
  const diff    = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours   = Math.floor(minutes / 60)

  if (i18n.language === "ur") {
    if (minutes < 1)  return "ابھی"
    if (minutes < 60) return `${minutes} منٹ پہلے`
    if (hours < 24)   return `${hours} گھنٹے پہلے`
    return `${Math.floor(hours / 24)} دن پہلے`
  }

  if (minutes < 1)  return "just now"
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24)   return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
