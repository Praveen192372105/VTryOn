import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { EmptyState } from "../empty-state"
import { Button } from "../../ui/button"

describe("EmptyState Component", () => {
  it("renders title and description properly", () => {
    render(
      <EmptyState
        title="Your fitting room is empty"
        description="Add a photo to begin trying on clothes."
      />
    )

    expect(screen.getByText("Your fitting room is empty")).toBeInTheDocument()
    expect(screen.getByText("Add a photo to begin trying on clothes.")).toBeInTheDocument()
  })

  it("renders action button when provided", () => {
    render(
      <EmptyState
        title="Empty"
        action={<Button>Add photo</Button>}
      />
    )

    expect(screen.getByRole("button", { name: /add photo/i })).toBeInTheDocument()
  })
})
