import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { TypeBadge } from "./TypeBadge"

describe("TypeBadge", () => {
  it("renders 'Scheduled' label for scheduled type", () => {
    render(<TypeBadge type="scheduled" />)
    expect(screen.getByText("schedule.types.scheduled")).toBeInTheDocument()
  })

  it("renders 'Unplanned' label for unplanned type", () => {
    render(<TypeBadge type="unplanned" />)
    expect(screen.getByText("schedule.types.unplanned")).toBeInTheDocument()
  })

  it("falls back to scheduled styling for unknown type", () => {
    render(<TypeBadge type="something_unexpected" />)
    // Should not crash — falls back to default config
    expect(screen.getByText("schedule.types.scheduled")).toBeInTheDocument()
  })
})