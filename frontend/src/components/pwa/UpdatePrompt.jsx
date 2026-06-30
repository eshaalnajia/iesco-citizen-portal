import { usePWAUpdate } from "@/hooks/usePWAUpdate"
import { Button }       from "@/components/ui/button"
import { RefreshCw, X } from "lucide-react"
import { useState }     from "react"
import { useTranslation } from "react-i18next"

export function UpdatePrompt() {
  const { needsRefresh, applyUpdate } = usePWAUpdate()
  const [dismissed, setDismissed]     = useState(false)
  const { t } = useTranslation()

  if (!needsRefresh || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:w-80 z-50
                    bg-white rounded-xl shadow-2xl border border-slate-200 p-4
                    animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-iesco-teal/10 flex
                        items-center justify-center flex-shrink-0">
          <RefreshCw className="h-4 w-4 text-iesco-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-slate-900">
            {t("pwa.newVersion")}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("pwa.newVersionDetail")}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <Button
        size="sm"
        className="w-full mt-3"
        onClick={applyUpdate}
      >
        {t("pwa.refreshNow")}
      </Button>
    </div>
  )
}
