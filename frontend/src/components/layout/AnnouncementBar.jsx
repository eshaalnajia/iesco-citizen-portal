import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { X, Megaphone, AlertTriangle, Info } from "lucide-react"
import api from "@/services/api"

const TYPE_CONFIG = {
  info: {
    bg:      "bg-iesco-teal",
    text:    "text-white",
    icon:    Info,
    iconCls: "text-white/80",
  },
  warning: {
    bg:      "bg-amber-500",
    text:    "text-white",
    icon:    AlertTriangle,
    iconCls: "text-white/80",
  },
  alert: {
    bg:      "bg-red-600",
    text:    "text-white",
    icon:    Megaphone,
    iconCls: "text-white/80",
  },
}

async function fetchAnnouncements() {
  const { data } = await api.get("/announcements/active")
  return data.data ?? []
}

export function AnnouncementBar() {
  const [currentIdx, setCurrentIdx]     = useState(0)
  const [dismissed, setDismissed]       = useState(false)
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("iesco-dismissed-announcements") || "[]")
    } catch { return [] }
  })

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements-active"],
    queryFn:  fetchAnnouncements,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (announcements.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIdx(i => (i + 1) % announcements.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [announcements.length])

  const active = announcements.filter(a => !dismissedIds.includes(a.id))
  if (dismissed || active.length === 0) return null

  const announcement = active[currentIdx % active.length]
  const config       = TYPE_CONFIG[announcement.type] ?? TYPE_CONFIG.info
  const Icon         = config.icon

  function handleDismiss() {
    const newDismissed = [...dismissedIds, announcement.id]
    setDismissedIds(newDismissed)
    localStorage.setItem("iesco-dismissed-announcements", JSON.stringify(newDismissed))
    if (newDismissed.length >= announcements.length) setDismissed(true)
  }

  return (
    <div className={`${config.bg} ${config.text} relative z-50`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <Icon className={`h-4 w-4 flex-shrink-0 ${config.iconCls}`} />

        <p className="flex-1 text-sm font-medium text-center truncate">
          {announcement.text}
          {announcement.link && (
            <a href={announcement.link}
               className="ml-2 underline underline-offset-2 font-bold hover:opacity-80">
              {announcement.link_text} →
            </a>
          )}
        </p>

        {active.length > 1 && (
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
            {active.map((_, i) => (
              <button key={i}
                onClick={() => setCurrentIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all
                  ${i === currentIdx % active.length
                    ? "bg-white"
                    : "bg-white/40"
                  }`}
              />
            ))}
          </div>
        )}

        <button onClick={handleDismiss}
          className="flex-shrink-0 p-0.5 hover:bg-white/20 rounded transition-colors"
          aria-label="Dismiss announcement">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}