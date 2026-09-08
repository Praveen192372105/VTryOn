import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ErrorState } from "../error-state"

describe("ErrorState Component", () => {
  it("renders safe user-facing title and message with alert role", () => {
    render(
      <ErrorState
        title="Generation Failed"
        message="The GPU cluster could not process the garment fit."
      />
    )

    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByText("Generation Failed")).toBeInTheDocument()
    expect(screen.getByText("The GPU cluster could not process the garment fit.")).toBeInTheDocument()
  })

  it("renders request ID reference when provided", () => {
    render(
      <ErrorState
        message="Service unavailable"
        requestId="req_01abc999"
      />
    )

    expect(screen.getByText("req_01abc999")).toBeInTheDocument()
  })

  it("calls onRetry callback when retry button is clicked", () => {
    const handleRetry = vi.fn()
    render(
      <ErrorState
        message="Network error"
        onRetry={handleRetry}
      />
    )

    const retryBtn = screen.getByRole("button", { name: /try again/i })
    fireEvent.click(retryBtn)
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })
})
