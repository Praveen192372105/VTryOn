import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { PersonUploadPreview } from "../person-upload-preview"
import type { ValidationResult } from "../../types"

describe("PersonUploadPreview", () => {
  const mockFile = new File(["dummy-binary-data"], "model_portrait.jpg", {
    type: "image/jpeg",
  })
  const mockMetadata = {
    width: 768,
    height: 1024,
    aspectRatio: 768 / 1024,
    format: "image/jpeg",
  }
  const validResult: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    issues: [],
  }

  it("renders image preview, quiet metadata, and action affordances", () => {
    render(
      <PersonUploadPreview
        file={mockFile}
        previewUrl="blob:local-preview"
        metadata={mockMetadata}
        validation={validResult}
        onConfirm={vi.fn()}
        onReselect={vi.fn()}
      />
    )

    expect(screen.getByAltText("Your selected person photo")).toBeInTheDocument()
    expect(screen.getByText("model_portrait.jpg")).toBeInTheDocument()
    expect(screen.getByText(/768 × 1024 px/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Use this photo/i })).toBeEnabled()
    expect(screen.getByRole("button", { name: /Choose another/i })).toBeInTheDocument()
  })

  it("toggles framing guidance overlay on button click", () => {
    render(
      <PersonUploadPreview
        file={mockFile}
        previewUrl="blob:local-preview"
        metadata={mockMetadata}
        validation={validResult}
        onConfirm={vi.fn()}
        onReselect={vi.fn()}
      />
    )

    const toggleBtn = screen.getByRole("button", { name: /Hide framing guides/i })
    expect(screen.getByTestId("framing-overlay")).toBeInTheDocument()

    fireEvent.click(toggleBtn)
    expect(screen.queryByTestId("framing-overlay")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Show framing guides/i }))
    expect(screen.getByTestId("framing-overlay")).toBeInTheDocument()
  })

  it("displays non-blocking warnings while keeping confirm button enabled", () => {
    const warningResult: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [
        {
          code: "wide-framing",
          severity: "warning",
          message: "This photo is quite wide.",
        },
      ],
      issues: [],
    }

    render(
      <PersonUploadPreview
        file={mockFile}
        previewUrl="blob:local-preview"
        metadata={{ ...mockMetadata, width: 1200, height: 800, aspectRatio: 1.5 }}
        validation={warningResult}
        onConfirm={vi.fn()}
        onReselect={vi.fn()}
      />
    )

    expect(screen.getByText(/Framing suggestion/i)).toBeInTheDocument()
    expect(screen.getByText("This photo is quite wide.")).toBeInTheDocument()
    // Invariant: Non-blocking warning must NOT disable submission
    expect(screen.getByRole("button", { name: /Use this photo/i })).toBeEnabled()
  })

  it("disables confirm button when blocking validation errors exist", () => {
    const errorResult: ValidationResult = {
      isValid: false,
      errors: [
        {
          code: "dimensions-too-small",
          severity: "error",
          message: "Image dimensions are below minimum.",
        },
      ],
      warnings: [],
      issues: [],
    }

    render(
      <PersonUploadPreview
        file={mockFile}
        previewUrl="blob:local-preview"
        metadata={{ ...mockMetadata, width: 200, height: 200 }}
        validation={errorResult}
        onConfirm={vi.fn()}
        onReselect={vi.fn()}
      />
    )

    expect(screen.getByText(/Upload blocked/i)).toBeInTheDocument()
    expect(screen.getByText("Image dimensions are below minimum.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Use this photo/i })).toBeDisabled()
  })

  it("invokes onReselect when Choose another is clicked", () => {
    const handleReselect = vi.fn()
    render(
      <PersonUploadPreview
        file={mockFile}
        previewUrl="blob:local-preview"
        metadata={mockMetadata}
        validation={validResult}
        onConfirm={vi.fn()}
        onReselect={handleReselect}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /Choose another/i }))
    expect(handleReselect).toHaveBeenCalledTimes(1)
  })
})
