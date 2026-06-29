import { useEffect }       from "react"
import { useQueryClient }  from "@tanstack/react-query"
import { supabase }        from "@/lib/supabase"
import { scheduleKeys }    from "@/hooks/useSchedule"

export function useRealtimeSchedules() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel("schedules-realtime")
      .on(
        "postgres_changes",
        {
          event:  "*",
          schema: "public",
          table:  "schedules",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: scheduleKeys.all() })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [queryClient])
}
