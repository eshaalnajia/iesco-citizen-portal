/**
 * Given a feeder's status and today's schedule entries,
 * returns a human-readable restoration time estimate.
 */
export function getRestorationInfo(feeder, todaySchedules = []) {
  const { status } = feeder

  if (status === "on") {
    return { type: "on", message: "Power is currently on", time: null }
  }

  if (status === "maintenance") {
    const activeWindow = todaySchedules.find((s) => s.is_active && s.type === "maintenance")
    if (activeWindow) {
      return {
        type:    "maintenance",
        message: "Maintenance work in progress",
        time:    activeWindow.end_time,
        label:   `Expected completion: ${formatTime(activeWindow.end_time)}`,
      }
    }
    return {
      type:    "maintenance",
      message: "Maintenance work in progress",
      time:    null,
      label:   "Completion time not available",
    }
  }

  if (status === "load_shedding" || status === "shedding_soon") {
    const activeWindow = todaySchedules.find(
      (s) => s.is_active && s.type === "scheduled"
    )
    if (activeWindow) {
      const minutesLeft = minutesUntil(activeWindow.end_time)
      return {
        type:         "scheduled",
        message:      "Scheduled load shedding",
        time:         activeWindow.end_time,
        minutesLeft,
        label:        minutesLeft > 0
          ? `Power returns at ${formatTime(activeWindow.end_time)} - ${formatMinutes(minutesLeft)} remaining`
          : `Power should have returned at ${formatTime(activeWindow.end_time)}`,
        isOverdue:    minutesLeft <= 0,
      }
    }

    const nextWindow = todaySchedules
      .filter((s) => !s.is_active && s.type === "scheduled")
      .sort((a, b) => a.start_time.localeCompare(b.start_time))[0]

    if (nextWindow) {
      const minsUntilStart = minutesUntil(nextWindow.start_time)
      return {
        type:    "upcoming",
        message: "Shedding starts soon",
        time:    nextWindow.start_time,
        label:   `Starts at ${formatTime(nextWindow.start_time)} - ${formatMinutes(minsUntilStart)} from now`,
      }
    }
  }

  if (status === "fault") {
    return {
      type:    "fault",
      message: "Unexpected power outage",
      time:    null,
      label:   "Restoration time unknown - IESCO team has been notified",
    }
  }

  return {
    type:    "no_data",
    message: "No data available",
    time:    null,
    label:   "Contact IESCO for current status",
  }
}

function formatTime(timeStr) {
  if (!timeStr) return "-"
  const [h, m] = timeStr.split(":").map(Number)
  const ampm   = h >= 12 ? "PM" : "AM"
  const hour   = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
}

function minutesUntil(timeStr) {
  if (!timeStr) return null
  const now      = new Date()
  const [h, m]   = timeStr.split(":").map(Number)
  const target   = new Date(now)
  target.setHours(h, m, 0, 0)
  return Math.round((target - now) / 60000)
}

function formatMinutes(mins) {
  if (mins === null) return ""
  const absMin = Math.abs(mins)
  if (absMin < 60) return `${absMin} min`
  const h = Math.floor(absMin / 60)
  const m = absMin % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

