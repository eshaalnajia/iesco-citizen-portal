import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  getTodaySchedule,
  getActiveOutages,
  getSectorSchedule,
  createSchedule,
  deleteSchedule,
} from "@/services/scheduleService"

export const scheduleKeys = {
  all:    () => ["schedules"],
  today:  (sector) => ["schedules", "today", sector],
  active: () => ["schedules", "active"],
  sector: (sector, days) => ["schedules", "sector", sector, days],
  feeder: (id, days) => ["schedules", "feeder", id, days],
}

export function useTodaySchedule(sector = null) {
  return useQuery({
    queryKey:        scheduleKeys.today(sector),
    queryFn:         () => getTodaySchedule(sector),
    staleTime:       1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })
}

export function useActiveOutages() {
  return useQuery({
    queryKey:                    scheduleKeys.active(),
    queryFn:                     getActiveOutages,
    staleTime:                   1000 * 30,
    refetchInterval:             1000 * 30,
    refetchIntervalInBackground: true,
  })
}

export function useSectorSchedule(sector, daysAhead = 7) {
  return useQuery({
    queryKey:  scheduleKeys.sector(sector, daysAhead),
    queryFn:   () => getSectorSchedule(sector, daysAhead),
    enabled:   !!sector,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSchedule,
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all() })
    },
  })
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSchedule,
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all() })
    },
  })
}
