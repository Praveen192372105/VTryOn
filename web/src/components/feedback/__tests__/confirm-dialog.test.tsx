import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ConfirmDialog } from "../confirm-dialog"

describe("ConfirmDialog Component", () => {
  it("renders modal when open is true", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Delete portrait photo?"
        description="This action cannot be undone."
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByText("Delete portrait photo?")).toBeInTheDocument()
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
  })

  it("calls onConfirm when confirm button is clicked", () => {
    const handleConfirm = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Confirm action"
        description="Consequences"
        confirmLabel="Proceed"
        onConfirm={handleConfirm}
      />
    )

    const confirmBtn = screen.getByRole("button", { name: /proceed/i })
    fireEvent.click(confirmBtn)
    expect(handleConfirm).toHaveBeenCalledTimes(1)
  })

  it("calls onOpenChange(false) when cancel button is clicked", () => {
    const handleOpenChange = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={handleOpenChange}
        title="Cancel test"
        description="Test desc"
        onConfirm={vi.fn()}
      />
    )

    const cancelBtn = screen.getByRole("button", { name: /cancel/i })
    fireEvent.click(cancelBtn)
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })
})
