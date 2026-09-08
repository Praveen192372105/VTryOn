import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { PageHeader } from "../page-header"

describe("PageHeader Component", () => {
  it("renders title as h1 and description", () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Virtual Studio"
          description="Synthesize your looks with tailored fit."
        />
      </MemoryRouter>
    )

    const heading = screen.getByRole("heading", { level: 1, name: "Virtual Studio" })
    expect(heading).toBeInTheDocument()
    expect(screen.getByText("Synthesize your looks with tailored fit.")).toBeInTheDocument()
  })

  it("renders back link when backHref is provided", () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Garment View"
          backHref="/app/outfits"
          backLabel="Back to Outfits"
        />
      </MemoryRouter>
    )

    const backLink = screen.getByRole("link", { name: /back to outfits/i })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute("href", "/app/outfits")
  })

  it("calls onBack when back button is clicked", () => {
    const handleBack = vi.fn()
    render(
      <MemoryRouter>
        <PageHeader
          title="Action View"
          onBack={handleBack}
          backLabel="Go Back"
        />
      </MemoryRouter>
    )

    const backBtn = screen.getByRole("button", { name: /go back/i })
    fireEvent.click(backBtn)
    expect(handleBack).toHaveBeenCalledTimes(1)
  })

  it("renders custom actions slot", () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Header with Actions"
          actions={<button data-testid="primary-action">New Outfit</button>}
        />
      </MemoryRouter>
    )

    expect(screen.getByTestId("primary-action")).toBeInTheDocument()
  })
})
