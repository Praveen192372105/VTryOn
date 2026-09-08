import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import HistoryPage from "../history-page"
import * as useTryOnHistoryHook from "../../../features/try-on/hooks/use-try-on-history"
import { createAllProvidersWrapper } from "../../../test/render"
import type { TryOnListResponse } from "../../../features/try-on/types"

describe("HistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders loading skeletons while fetching history", () => {
    vi.spyOn(useTryOnHistoryHook, "useTryOnHistory").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    const wrapper = createAllProvidersWrapper(["/app/history"])
    render(<HistoryPage />, { wrapper })

    expect(screen.getByText("History")).toBeInTheDocument()
    expect(screen.getByText("Your recent virtual try-ons.")).toBeInTheDocument()
  })

  it("renders empty state when no try-on jobs exist", () => {
    const emptyResponse: TryOnListResponse = {
      items: [],
      pagination: {
        page: 1,
        page_size: 12,
        total: 0,
        total_pages: 0,
      },
    }

    vi.spyOn(useTryOnHistoryHook, "useTryOnHistory").mockReturnValue({
      data: emptyResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    const wrapper = createAllProvidersWrapper(["/app/history"])
    render(<HistoryPage />, { wrapper })

    expect(screen.getByText("No try-ons yet")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Open Studio/i })).toBeInTheDocument()
  })

  it("renders list of try-on jobs and pagination controls", () => {
    const populatedResponse: TryOnListResponse = {
      items: [
        {
          id: "job_01",
          status: "succeeded",
          person_upload_id: "upl_1",
          outfit: {
            id: "out_1",
            name: "Classic Trench Coat",
            category: "outerwear",
            thumbnail_url: "https://example.com/coat.jpg",
          },
          result: {
            id: "res_1",
            image_url: "/api/v1/try-ons/job_01/content",
            width: 768,
            height: 1024,
          },
          created_at: "2026-09-01T10:00:00Z",
        },
        {
          id: "job_02",
          status: "failed",
          person_upload_id: "upl_2",
          outfit: {
            id: "out_2",
            name: "Floral Sundress",
            category: "dresses",
          },
          created_at: "2026-09-02T11:00:00Z",
        },
      ],
      pagination: {
        page: 1,
        page_size: 12,
        total: 18,
        total_pages: 2,
      },
    }

    vi.spyOn(useTryOnHistoryHook, "useTryOnHistory").mockReturnValue({
      data: populatedResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    const wrapper = createAllProvidersWrapper(["/app/history"])
    render(<HistoryPage />, { wrapper })

    expect(screen.getByText("Classic Trench Coat")).toBeInTheDocument()
    expect(screen.getByText("Floral Sundress")).toBeInTheDocument()
    expect(screen.getByText("Ready")).toBeInTheDocument()
    expect(screen.getByText("Couldn't finish")).toBeInTheDocument()

    // Pagination elements
    expect(screen.getByLabelText("Try-on history pagination")).toBeInTheDocument()
    expect(screen.getByText(/total try-ons/i)).toBeInTheDocument()
    expect(screen.getByText("18")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Go to next page" })).toBeInTheDocument()
  })

  it("renders error state when request fails and allows retry", () => {
    const refetchMock = vi.fn()
    vi.spyOn(useTryOnHistoryHook, "useTryOnHistory").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network unreachable"),
      refetch: refetchMock,
    } as any)

    const wrapper = createAllProvidersWrapper(["/app/history"])
    render(<HistoryPage />, { wrapper })

    expect(screen.getByText("We couldn't load your try-on history")).toBeInTheDocument()
    expect(screen.getByText("Network unreachable")).toBeInTheDocument()
  })
})
