import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { StarRating } from "./StarRating"

describe("StarRating", () => {
  it("renders the correct number of stars", () => {
    const { container } = render(<StarRating value={3} max={5} />)
    const stars = container.querySelectorAll("svg")
    expect(stars.length).toBe(5)
  })

  it("does not call onSelect when not interactive", () => {
    const onSelect = vi.fn()
    const { container } = render(
      <StarRating value={0} interactive={false} onSelect={onSelect} />
    )
    const firstStar = container.querySelector("svg")
    fireEvent.click(firstStar)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("calls onSelect with the correct star number when interactive", () => {
    const onSelect = vi.fn()
    const { container } = render(
      <StarRating value={0} interactive onSelect={onSelect} />
    )
    const stars = container.querySelectorAll("svg")
    fireEvent.click(stars[2])
    expect(onSelect).toHaveBeenCalledWith(3)
  })
})