import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ImageFrame } from "../image-frame"

describe("ImageFrame Component", () => {
  it("renders image with correct alt text", () => {
    render(<ImageFrame src="https://example.com/photo.jpg" alt="Tailored Blazer" />)
    const img = screen.getByAltText("Tailored Blazer")
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg")
  })

  it("handles image load transition", () => {
    render(<ImageFrame src="https://example.com/photo.jpg" alt="Test Outfit" />)
    const img = screen.getByAltText("Test Outfit")
    expect(img).toHaveClass("opacity-0")

    fireEvent.load(img)
    expect(img).toHaveClass("opacity-100")
  })

  it("displays fallback state on image load error", () => {
    render(
      <ImageFrame
        src="https://example.com/broken.jpg"
        alt="Broken Image"
        fallbackText="Garment Unavailable"
      />
    )
    const img = screen.getByAltText("Broken Image")
    fireEvent.error(img)

    expect(screen.getByText("Garment Unavailable")).toBeInTheDocument()
  })

  it("renders selection indicator when selected", () => {
    const { container } = render(
      <ImageFrame
        src="https://example.com/selected.jpg"
        alt="Selected Item"
        selected
      />
    )
    expect(container.firstChild).toHaveClass("ring-2 ring-primary")
  })

  it("supports contain objectFit for full render viewing", () => {
    render(
      <ImageFrame
        src="https://example.com/render.jpg"
        alt="Full Composition"
        objectFit="contain"
      />
    )
    expect(screen.getByAltText("Full Composition")).toHaveClass("object-contain")
  })
})
