import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SectionShell } from "../section-shell"

describe("SectionShell Component", () => {
  it("renders children inside a section element", () => {
    render(
      <SectionShell>
        <p>Section Content</p>
      </SectionShell>
    )

    expect(screen.getByText("Section Content")).toBeInTheDocument()
  })

  it("applies app size class by default", () => {
    const { container } = render(
      <SectionShell>
        <div>Content</div>
      </SectionShell>
    )

    expect(container.firstChild).toHaveClass("max-w-7xl")
  })

  it("applies marketing size class with vertical padding", () => {
    const { container } = render(
      <SectionShell size="marketing">
        <div>Marketing Section</div>
      </SectionShell>
    )

    expect(container.firstChild).toHaveClass("max-w-7xl")
    expect(container.firstChild).toHaveClass("py-12")
  })
})
