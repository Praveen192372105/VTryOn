import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Button, AppButton } from "../button"

describe("Button / AppButton Component", () => {
  it("renders with children and accessible role", () => {
    render(<Button>Generate Look</Button>)
    const btn = screen.getByRole("button", { name: /generate look/i })
    expect(btn).toBeInTheDocument()
  })

  it("AppButton is an alias of Button and renders identically", () => {
    render(<AppButton>App Action</AppButton>)
    expect(screen.getByRole("button", { name: /app action/i })).toBeInTheDocument()
  })

  it("applies variant classes correctly", () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole("button")).toHaveClass("bg-destructive/15")

    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole("button")).toHaveClass("border-border")

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole("button")).toHaveClass("hover:bg-surface-subtle")
  })

  it("supports size variants", () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole("button")).toHaveClass("h-8.5")

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole("button")).toHaveClass("h-12")
  })

  it("renders loading state with aria-busy and disables clicks", () => {
    const handleClick = vi.fn()
    render(<Button loading onClick={handleClick}>Submit</Button>)

    const btn = screen.getByRole("button", { name: /submit/i })
    expect(btn).toHaveAttribute("aria-busy", "true")
    expect(btn).toBeDisabled()

    fireEvent.click(btn)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it("renders leading and trailing icons", () => {
    render(
      <Button
        leadingIcon={<span data-testid="leading-icon">★</span>}
        trailingIcon={<span data-testid="trailing-icon">→</span>}
      >
        Styled
      </Button>
    )

    expect(screen.getByTestId("leading-icon")).toBeInTheDocument()
    expect(screen.getByTestId("trailing-icon")).toBeInTheDocument()
  })

  it("renders fullWidth modifier", () => {
    render(<Button fullWidth>Full Width Button</Button>)
    expect(screen.getByRole("button")).toHaveClass("w-full")
  })
})
