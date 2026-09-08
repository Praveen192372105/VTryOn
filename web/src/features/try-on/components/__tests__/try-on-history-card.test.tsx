import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TryOnHistoryCard } from "../try-on-history-card"
import { createAllProvidersWrapper } from "../../../../test/render"
import type { TryOnListItem } from "../../types"

describe("TryOnHistoryCard", () => {
  const mockSucceededJob: TryOnListItem = {
    id: "job_succ_1",
    status: "succeeded",
    person_upload_id: "upl_1",
    outfit: {
      id: "out_1",
      name: "Silk Evening Dress",
      category: "dresses",
      thumbnail_url: "https://example.com/dress.jpg",
    },
    result: {
      id: "res_1",
      image_url: "/api/v1/try-ons/job_succ_1/content",
      width: 768,
      height: 1024,
    },
    created_at: "2026-09-01T12:00:00Z",
  }

  const mockQueuedJob: TryOnListItem = {
    id: "job_queue_1",
    status: "queued",
    person_upload_id: "upl_2",
    outfit: {
      id: "out_2",
      name: "Tailored Wool Blazer",
      category: "outerwear",
      thumbnail_url: "https://example.com/blazer.jpg",
    },
    created_at: "2026-09-02T12:00:00Z",
  }

  const mockProcessingJob: TryOnListItem = {
    id: "job_proc_1",
    status: "processing",
    person_upload_id: "upl_3",
    outfit: {
      id: "out_3",
      name: "Cashmere Sweater",
      category: "knitwear",
      thumbnail_url: "https://example.com/sweater.jpg",
    },
    created_at: "2026-09-03T12:00:00Z",
  }

  const mockFailedJob: TryOnListItem = {
    id: "job_fail_1",
    status: "failed",
    person_upload_id: "upl_4",
    outfit: {
      id: "out_4",
      name: "Linen Shirt",
      category: "tops",
      thumbnail_url: "https://example.com/shirt.jpg",
    },
    error: {
      code: "INVALID_INPUT",
      message: "Garment pose mismatch",
    },
    created_at: "2026-09-04T12:00:00Z",
  }

  it("renders succeeded job with result thumbnail and Ready badge", () => {
    const wrapper = createAllProvidersWrapper(["/app/history"])
    render(<TryOnHistoryCard job={mockSucceededJob} onDelete={vi.fn()} />, { wrapper })

    expect(screen.getByText("Silk Evening Dress")).toBeInTheDocument()
    expect(screen.getByText("Ready")).toBeInTheDocument()
    expect(screen.getByText("dresses")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Delete try-on/i })).toBeInTheDocument()
  })

  it("renders queued job with Waiting badge and no delete button", () => {
    const wrapper = createAllProvidersWrapper(["/app/history"])
    render(<TryOnHistoryCard job={mockQueuedJob} onDelete={vi.fn()} />, { wrapper })

    expect(screen.getByText("Tailored Wool Blazer")).toBeInTheDocument()
    expect(screen.getByText("Waiting to start")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Delete try-on/i })).not.toBeInTheDocument()
  })

  it("renders processing job with Creating badge and no delete button", () => {
    const wrapper = createAllProvidersWrapper(["/app/history"])
    render(<TryOnHistoryCard job={mockProcessingJob} onDelete={vi.fn()} />, { wrapper })

    expect(screen.getByText("Cashmere Sweater")).toBeInTheDocument()
    expect(screen.getByText("Creating your look")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Delete try-on/i })).not.toBeInTheDocument()
  })

  it("renders failed job with Couldn't finish badge and delete button", () => {
    const wrapper = createAllProvidersWrapper(["/app/history"])
    render(<TryOnHistoryCard job={mockFailedJob} onDelete={vi.fn()} />, { wrapper })

    expect(screen.getByText("Linen Shirt")).toBeInTheDocument()
    expect(screen.getByText("Couldn't finish")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Delete try-on/i })).toBeInTheDocument()
  })

  it("triggers onDelete callback when delete button is clicked on terminal card", () => {
    const onDeleteMock = vi.fn()
    const wrapper = createAllProvidersWrapper(["/app/history"])
    render(<TryOnHistoryCard job={mockSucceededJob} onDelete={onDeleteMock} />, { wrapper })

    const deleteBtn = screen.getByRole("button", { name: /Delete try-on/i })
    fireEvent.click(deleteBtn)

    expect(onDeleteMock).toHaveBeenCalledTimes(1)
    expect(onDeleteMock).toHaveBeenCalledWith("job_succ_1")
  })
})
