import api from "@/services/api"

export async function getTodaySchedule(sector = null) {
  const params = sector ? { sector } : {}
  const { data } = await api.get("/schedules/today", { params })
  return data
}

export async function getActiveOutages() {
  const { data } = await api.get("/schedules/active")
  return data
}

export async function getFeederSchedule(feederId, daysAhead = 7) {
  const { data } = await api.get(`/schedules/feeder/${feederId}`, {
    params: { days_ahead: daysAhead },
  })
  return data
}

export async function getSectorSchedule(sector, daysAhead = 7) {
  const { data } = await api.get(`/schedules/sector/${sector}`, {
    params: { days_ahead: daysAhead },
  })
  return data
}

export async function createSchedule(payload) {
  const { data } = await api.post("/schedules/", payload)
  return data
}

export async function deleteSchedule(scheduleId) {
  const { data } = await api.delete(`/schedules/${scheduleId}`)
  return data
}
