import { useQuery } from "@tanstack/react-query"
import {
  getCurrentTariffs,
  calculateBill,
  getTariffHistory,
} from "@/services/tariffService"

export const tariffKeys = {
  all:       ()                 => ["tariffs"],
  current:   (type)             => ["tariffs", "current", type],
  calculate: (units, type, pct) => ["tariffs", "calc", units, type, pct],
  history:   (type)             => ["tariffs", "history", type],
}

export function useCurrentTariffs(consumerType) {
  return useQuery({
    queryKey:  tariffKeys.current(consumerType),
    queryFn:   () => getCurrentTariffs(consumerType),
    staleTime: 1000 * 60 * 60,
    enabled:   !!consumerType,
  })
}

export function useBillCalculation(units, consumerType, peakHoursPct, enabled) {
  return useQuery({
    queryKey:  tariffKeys.calculate(units, consumerType, peakHoursPct),
    queryFn:   () => calculateBill(units, consumerType, peakHoursPct),
    enabled:   enabled && units > 0 && !!consumerType,
    staleTime: 1000 * 60 * 60,
  })
}

export function useTariffHistory(consumerType) {
  return useQuery({
    queryKey:  tariffKeys.history(consumerType),
    queryFn:   () => getTariffHistory(consumerType),
    staleTime: 1000 * 60 * 60,
    enabled:   !!consumerType,
  })
}
