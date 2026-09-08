import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatusBadge, type CanonicalTryOnStatus } from "../status-badge"

describe("StatusBadge Component", () => {
  const testCases: { status: CanonicalTryOnStatus; expectedLabel: string }[] = [
    { status: "queued", expectedLabel: "Waiting to start" },
    { status: "processing", expectedLabel: "Creating your look" },
    { status: "succeeded", expectedLabel: "Ready" },
    { status: "failed", expectedLabel: "Couldn't finish" },
  ]

  testCases.forEach(({ status, expectedLabel }) => {
    it(`renders correct accessible label for canonical status '${status}'`, () => {
      render(<StatusBadge status={status} />)

      const badge = screen.getByRole("status")
      expect(badge).toHaveAttribute("aria-label", `Status: ${expectedLabel}`)
      expect(screen.getByText(expectedLabel)).toBeInTheDocument()
    })
  })

  it("applies processing animation only for processing status", () => {
    const { container } = render(<StatusBadge status="processing" />)
    const icon = container.querySelector("svg")
    expect(icon).toHaveClass("animate-spin")
  })

  it("does not spin icon for succeeded or queued statuses", () => {
    const { container: queuedContainer } = render(<StatusBadge status="queued" />)
    expect(queuedContainer.querySelector("svg")).not.toHaveClass("animate-spin")

    const { container: succeededContainer } = render(<StatusBadge status="succeeded" />)
    expect(succeededContainer.querySelector("svg")).not.toHaveClass("animate-spin")
  })
})
