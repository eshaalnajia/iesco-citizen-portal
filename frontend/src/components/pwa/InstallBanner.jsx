import { useState }          from "react"
import { useInstallPrompt }  from "@/hooks/useInstallPrompt"
import { Button }            from "@/components/ui/button"
import { Download, X, WifiOff } from "lucide-react"
import { useTranslation }    from "react-i18next"

export function InstallBanner() {
  const { canInstall, promptInstall } = useInstallPrompt()
  const { t } = useTranslation()
  const [dismissed, setDismissed]     = useState(
    localStorage.getItem("iesco-install-dismissed") === "true"
  )

  if (!canInstall || dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    localStorage.setItem("iesco-install-dismissed", "true")
  }

  async function handleInstall() {
    await promptInstall()
  }

  return (
    <div className="bg-iesco-navy text-white px-4 py-3 flex items-center
                    justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center
                        justify-center flex-shrink-0">
          <WifiOff className="h-4 w-4 text-iesco-teal" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("pwa.installTitle")}</p>
          <p className="text-xs text-slate-300 truncate">
            {t("pwa.installDetail")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleInstall}
          className="bg-iesco-teal hover:bg-iesco-teal/90 text-white"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          {t("pwa.install")}
        </Button>
        <button
          onClick={handleDismiss}
          className="text-slate-300 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
