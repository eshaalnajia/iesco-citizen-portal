import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useFeedersRealtime() {
  const [feeders, setFeeders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("feeders")
      .select("*")
      .then(({ data }) => {
        setFeeders(data || [])
        setLoading(false)
      })

    const channel = supabase
      .channel("feeders-live")
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
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return { feeders, loading }
}
