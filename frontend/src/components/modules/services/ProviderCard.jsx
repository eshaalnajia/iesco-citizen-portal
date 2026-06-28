import { useState }              from "react"
import { useTranslation }        from "react-i18next"
import { Phone, MessageCircle,
         MapPin, Star,
         ChevronDown, ChevronUp } from "lucide-react"
import { Button }                from "@/components/ui/button"
import { ProviderTypeBadge }     from "./ProviderTypeBadge"
import { VerifiedBadge }         from "./VerifiedBadge"
import { RatingDisplay }         from "./StarRating"
import { RateProviderDialog }    from "./RateProviderDialog"
import { cn }                    from "@/lib/utils"

function whatsappUrl(phone, providerName) {
  const digits = phone.replace(/\D/g, "")
  const intl   = digits.startsWith("0") ? "92" + digits.slice(1) : digits
  const msg    = encodeURIComponent(
    `Hello, I found your listing on the IESCO Citizen Portal. I need electrical services in my area.`
  )
  return `https://wa.me/${intl}?text=${msg}`
}

export function ProviderCard({ provider }) {
  const { t }                     = useTranslation()
  const [expanded, setExpanded]   = useState(false)
  const [rateOpen, setRateOpen]   = useState(false)

  const hasWhatsApp = !!provider.whatsapp

  return (
    <>
      <div className={cn(
        "bg-white rounded-xl border transition-all duration-150",
        expanded
          ? "border-iesco-teal/30 shadow-sm"
          : "border-slate-200 hover:border-slate-300"
      )}>

        <div className="p-4 space-y-3">

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                  {provider.name}
                </h3>
                {provider.is_verified && <VerifiedBadge size="xs" />}
              </div>
              <ProviderTypeBadge type={provider.provider_type} />
            </div>

            <div className={cn(
              "flex-shrink-0 w-2 h-2 rounded-full mt-1.5",
              provider.is_available ? "bg-green-500" : "bg-slate-300"
            )}
              title={provider.is_available ? t("services.available", "Available") : "Not available"}
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{provider.area}</span>
          </div>

          <RatingDisplay
            rating={provider.rating}
            totalReviews={provider.total_reviews}
            label={provider.rating_label}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              asChild
            >
              <a href={`tel:${provider.phone}`}>
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                {t("services.call", "Call")}
              </a>
            </Button>

            {hasWhatsApp && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs border-green-200 text-green-700
                           hover:bg-green-50"
                asChild
              >
                  <a
                  href={whatsappUrl(provider.whatsapp, provider.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                  {t("services.whatsapp", "WhatsApp")}
                </a>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="px-2 text-slate-400 hover:text-slate-600"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded
                ? <ChevronUp className="h-4 w-4" />
                : <ChevronDown className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">

            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <a
                href={`tel:${provider.phone}`}
                className="font-mono text-iesco-blue hover:underline"
              >
                {provider.phone}
              </a>
            </div>

            {hasWhatsApp && provider.whatsapp !== provider.phone && (
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                <a
                  href={whatsappUrl(provider.whatsapp, provider.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-green-700 hover:underline"
                >
                  {provider.whatsapp}
                </a>
              </div>
            )}

            {provider.address && (
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>{provider.address}</span>
              </div>
            )}

            {provider.license_number && (
              <p className="text-xs text-slate-400">
                {t("services.licenceNumber", "IESCO Licence")}: <span className="font-mono">{provider.license_number}</span>
              </p>
            )}

            {provider.is_verified && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5"
                onClick={() => setRateOpen(true)}
              >
                <Star className="h-3.5 w-3.5 text-amber-400" />
                {t("services.rateProvider", "Rate this provider")}
              </Button>
            )}
          </div>
        )}
      </div>

      <RateProviderDialog
        provider={provider}
        open={rateOpen}
        onOpenChange={setRateOpen}
      />
    </>
  )
}
