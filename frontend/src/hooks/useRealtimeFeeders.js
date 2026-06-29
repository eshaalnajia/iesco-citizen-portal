import { useEffect, useState, useCallback, useRef } from "react"
import { supabase }                                   from "@/lib/supabase"

const RECONNECT_DELAY_MS = 3000

export function useRealtimeFeeders() {
  const [feeders, setFeeders]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [realtimeStatus, setStatus] = useState("connecting")
  const channelRef                  = useRef(null)
  const retryRef                    = useRef(null)

  const fetchFeeders = useCallback(async () => {
    const { data, error } = await supabase
      .from("feeders")
      .select(
        "id, feeder_code, name, sector, boundary, " +
        "status, load_percent, reliability, last_updated"
      )
      .order("sector")

    if (error) {
      setError(error.message)
      return
    }

    setFeeders(data || [])
    setLoading(false)
    setError(null)
  }, [])

  const subscribeToRealtime = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel("feeders-realtime-v2", {
        config: { broadcast: { ack: true } },
      })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "feeders" },
        (payload) => {
          setFeeders((prev) =>
            prev.map((f) =>
              f.id === payload.new.id ? { ...f, ...payload.new } : f
            )
          )
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feeders" },
        () => {
          fetchFeeders()
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          setStatus("connected")
          if (retryRef.current) {
            clearTimeout(retryRef.current)
            retryRef.current = null
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setStatus("reconnecting")
          retryRef.current = setTimeout(() => {
            subscribeToRealtime()
          }, RECONNECT_DELAY_MS)
        } else if (status === "CLOSED") {
          setStatus("disconnected")
        }
      })

    channelRef.current = channel
    return channel
  }, [fetchFeeders])

  useEffect(() => {
    fetchFeeders()
    subscribeToRealtime()

    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [fetchFeeders, subscribeToRealtime])

  return {
    feeders,
    loading,
    error,
    realtimeStatus,
    refresh: fetchFeeders,
  }
}
