import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ImageCompare } from "../image-compare"

describe("ImageCompare Component", () => {
  it("renders both original and result images with slider role", () => {
    render(
      <ImageCompare
        originalSrc="https://example.com/portrait.jpg"
        resultSrc="https://example.com/result.jpg"
      />
    )

    const slider = screen.getByRole("slider", { name: /comparison position/i })
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveAttribute("aria-valuenow", "50")

    expect(screen.getByText("Original")).toBeInTheDocument()
    expect(screen.getByText("Try-On")).toBeInTheDocument()
  })

  it("adjusts split percentage with keyboard navigation", () => {
    render(
      <ImageCompare
        originalSrc="https://example.com/portrait.jpg"
        resultSrc="https://example.com/result.jpg"
      />
    )

    const slider = screen.getByRole("slider")

    // ArrowLeft decreases by 5
    fireEvent.keyDown(slider, { key: "ArrowLeft" })
    expect(slider).toHaveAttribute("aria-valuenow", "45")

    // ArrowRight increases by 5
    fireEvent.keyDown(slider, { key: "ArrowRight" })
    expect(slider).toHaveAttribute("aria-valuenow", "50")

    // Home jumps to 0
    fireEvent.keyDown(slider, { key: "Home" })
    expect(slider).toHaveAttribute("aria-valuenow", "0")

    // End jumps to 100
    fireEvent.keyDown(slider, { key: "End" })
    expect(slider).toHaveAttribute("aria-valuenow", "100")
  })

  it("renders comparison unavailable fallback when an image fails to load", () => {
    render(
      <ImageCompare
        originalSrc="https://example.com/bad.jpg"
        resultSrc="https://example.com/good.jpg"
      />
    )

    const origImg = screen.getByAltText("Original portrait photo")
    fireEvent.error(origImg)

    expect(screen.getByText(/comparison unavailable/i)).toBeInTheDocument()
  })
})
