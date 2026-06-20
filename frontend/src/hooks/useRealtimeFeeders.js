import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export function useRealtimeFeeders() {
  const [feeders, setFeeders]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetchFeeders = useCallback(async () => {
    const { data, error } = await supabase
      .from("feeders")
      .select("id, feeder_code, name, sector, boundary, status, reliability, last_updated")
      .order("sector")

    if (error) {
      setError(error.message)
      return
    }

    setFeeders(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchFeeders()

    const channel = supabase
      .channel("feeders-map-live")
      .on(
        "postgres_changes",
        {
          event:  "UPDATE",
          schema: "public",
          table:  "feeders",
        },
        (payload) => {
          setFeeders((prev) =>
            prev.map((f) =>
              f.id === payload.new.id
                ? { ...f, ...payload.new }
                : f
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchFeeders])

  return { feeders, loading, error, refresh: fetchFeeders }
}
