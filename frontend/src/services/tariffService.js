import api from "@/services/api"

export async function getConsumerTypes() {
  const { data } = await api.get("/tariffs/consumer-types")
  return data
}

export async function getCurrentTariffs(consumerType = "residential") {
  const { data } = await api.get("/tariffs/current", {
    params: { consumer_type: consumerType },
  })
  return data
}

export async function calculateBill(unitsConsumed, consumerType = "residential", peakHoursPct = 0.3) {
  const { data } = await api.get("/tariffs/calculate", {
    params: {
      units_consumed: unitsConsumed,
      consumer_type:  consumerType,
      peak_hours_pct: peakHoursPct,
    },
  })
  return data
}

export async function getTariffHistory(consumerType = "residential") {
  const { data } = await api.get("/tariffs/history", {
    params: { consumer_type: consumerType },
  })
  return data
}
