export function DurationDisplay({ startTime, endTime, durationHours }) {
  let computedHours = durationHours

  if (!computedHours && startTime && endTime) {
    const [sh, sm] = startTime.split(":").map(Number)
    const [eh, em] = endTime.split(":").map(Number)
    computedHours = (eh * 60 + em - (sh * 60 + sm)) / 60
  }

  const hours   = Math.floor(computedHours ?? 0)
  const minutes = Math.round(((computedHours ?? 0) - hours) * 60)

  const durationLabel =
    hours > 0 && minutes > 0
      ? `${hours}h ${minutes}m`
      : hours > 0
      ? `${hours} ${hours === 1 ? "hour" : "hours"}`
      : minutes > 0
      ? `${minutes} min`
      : ""

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-slate-700">
        {startTime.slice(0,5)} - {endTime.slice(0,5)}
      </span>
      {durationLabel && (
        <span className="text-xs text-slate-400">({durationLabel})</span>
      )}
    </div>
  )
}
