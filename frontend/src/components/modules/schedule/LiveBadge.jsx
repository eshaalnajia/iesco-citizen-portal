export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold
                     text-red-600 bg-red-50 border border-red-200
                     px-2 py-0.5 rounded-full animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      NOW
    </span>
  )
}
