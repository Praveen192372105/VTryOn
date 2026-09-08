import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { TryOnProcessing } from "../try-on-processing"
import { mockQueuedJob, mockProcessingJob } from "../../../../test/fixtures/try-on-fixtures"

describe("Component: TryOnProcessing (Job States)", () => {
  it("renders queued state with 'Waiting to start' copy and queued status badge", () => {
    render(
      <TryOnProcessing
        job={mockQueuedJob}
        outfitName="Silk Oxford Shirt"
        personImageUrl="/media/person.jpg"
        outfitImageUrl="/media/shirt.jpg"
      />
    )

    expect(screen.getAllByRole("status").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole("heading", { name: "Waiting to start" })).toBeInTheDocument()
    expect(screen.getByText(/Your try-on request is queued/i)).toBeInTheDocument()
    expect(screen.getByText("Silk Oxford Shirt")).toBeInTheDocument()
  })

  it("renders processing state with 'Creating your try-on' copy, percentage, and active progress indicator", () => {
    render(
      <TryOnProcessing
        job={mockProcessingJob}
        outfitName="Silk Oxford Shirt"
      />
    )

    expect(screen.getAllByRole("status").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole("heading", { name: "Creating your try-on" })).toBeInTheDocument()
    expect(screen.getByText(/Composing the garment with your photo/i)).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
    expect(screen.getByText(/\d+%/)).toBeInTheDocument()
  })

  it("announces status transitions politely via aria-live without spamming ticks", () => {
    const { rerender, container } = render(
      <TryOnProcessing job={mockQueuedJob} />
    )

    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
    expect(liveRegion?.textContent).toBe("Waiting to start your try-on.")

    // Re-rendering with same status does not overwrite
    rerender(<TryOnProcessing job={mockQueuedJob} />)
    expect(liveRegion?.textContent).toBe("Waiting to start your try-on.")

    // Status transition updates announcement
    rerender(<TryOnProcessing job={mockProcessingJob} />)
    expect(liveRegion?.textContent).toBe("Creating your try-on.")
  })
})
