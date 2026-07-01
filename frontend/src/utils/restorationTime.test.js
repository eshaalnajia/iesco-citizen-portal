import { describe, it, expect } from "vitest"
import { getRestorationInfo } from "./restorationTime"

describe("getRestorationInfo", () => {
  it("returns 'on' type when feeder status is on", () => {
    const result = getRestorationInfo({ status: "on" }, [])
    expect(result.type).toBe("on")
    expect(result.time).toBeNull()
  })

  it("returns fault type with no restoration time for unplanned faults", () => {
    const result = getRestorationInfo({ status: "fault" }, [])
    expect(result.type).toBe("fault")
    expect(result.time).toBeNull()
  })

  it("calculates restoration time for active scheduled shedding", () => {
    const futureTime = new Date()
    futureTime.setHours(futureTime.getHours() + 1)
    const endTimeStr = `${String(futureTime.getHours()).padStart(2, "0")}:${String(futureTime.getMinutes()).padStart(2, "0")}`

    const schedules = [{
      is_active: true,
      type: "scheduled",
      start_time: "08:00",
      end_time: endTimeStr,
    }]

    const result = getRestorationInfo({ status: "load_shedding" }, schedules)
    expect(result.type).toBe("scheduled")
    expect(result.isOverdue).toBe(false)
  })

  it("flags overdue restoration when end_time has passed", () => {
    const pastTime = new Date()
    pastTime.setMinutes(pastTime.getMinutes() - 30)
    const endTimeStr = `${String(pastTime.getHours()).padStart(2, "0")}:${String(pastTime.getMinutes()).padStart(2, "0")}`

    const schedules = [{
      is_active: true,
      type: "scheduled",
      start_time: "08:00",
      end_time: endTimeStr,
    }]

    const result = getRestorationInfo({ status: "load_shedding" }, schedules)
    expect(result.isOverdue).toBe(true)
  })

  it("returns no_data type for unrecognised status", () => {
    const result = getRestorationInfo({ status: "unknown_status" }, [])
    expect(result.type).toBe("no_data")
  })
})