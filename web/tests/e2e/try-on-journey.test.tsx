import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "../../src/features/auth"
import StudioPage from "../../src/pages/app/studio-page"
import TryOnDetailPage from "../../src/pages/app/try-on-detail-page"
import HistoryPage from "../../src/pages/app/history-page"
import { tokenStore } from "../../src/lib/auth/token-store"
import * as authApi from "../../src/features/auth/api"
import * as createTryOnApi from "../../src/features/try-on/api/create-try-on"
import * as getTryOnApi from "../../src/features/try-on/api/get-try-on"
import * as listTryOnsApi from "../../src/features/try-on/api/list-try-ons"
import * as getOutfitApi from "../../src/features/outfits/api/get-outfit"
import * as listOutfitsApi from "../../src/features/outfits/api/list-outfits"
import * as listUploadsApi from "../../src/features/uploads/api/list-uploads"
import { tryOnKeys } from "../../src/features/try-on/query-keys"
import {
  mockQueuedJob,
  mockProcessingJob,
  mockSucceededJob,
} from "../../src/test/fixtures/try-on-fixtures"
import { mockOutfitSilkShirt, mockOutfitListResponse } from "../../src/test/fixtures/outfit-fixtures"
import { mockPersonUpload1, mockPersonUploadListResponse } from "../../src/test/fixtures/upload-fixtures"

describe("E2E Journey: Try-On Creation, Generation & History Flow", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    tokenStore.setTokens("mock-access", "mock-refresh")

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue({
      id: "usr_1",
      name: "Alex Designer",
      email: "alex@example.com",
    })

    vi.spyOn(listUploadsApi, "listUploads").mockResolvedValue(mockPersonUploadListResponse)
    vi.spyOn(listOutfitsApi, "listOutfits").mockResolvedValue(mockOutfitListResponse)
    vi.spyOn(getOutfitApi, "getOutfit").mockResolvedValue(mockOutfitSilkShirt)
    vi.spyOn(listTryOnsApi, "listTryOns").mockResolvedValue({
      items: [
        {
          id: mockSucceededJob.id,
          status: "succeeded",
          person_upload_id: mockPersonUpload1.id,
          outfit_id: mockOutfitSilkShirt.id,
          created_at: mockSucceededJob.created_at,
          finished_at: mockSucceededJob.finished_at,
          result: mockSucceededJob.result,
          outfit: {
            id: mockOutfitSilkShirt.id,
            name: mockOutfitSilkShirt.name,
            category: mockOutfitSilkShirt.category,
            thumbnail_url: mockOutfitSilkShirt.image_url,
          },
        },
      ],
      pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
    })
  })

  afterEach(() => {
    tokenStore.clearTokens()
  })

  it("walks through studio submission, queued/processing/succeeded polling, and history review", async () => {
    vi.spyOn(createTryOnApi, "createTryOn").mockResolvedValue(mockQueuedJob)
    const getTryOnSpy = vi.spyOn(getTryOnApi, "getTryOn").mockResolvedValue(mockQueuedJob)

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter
            initialEntries={[
              `/app/studio?person=${mockPersonUpload1.id}&outfit=${mockOutfitSilkShirt.id}`,
            ]}
          >
            <Routes>
              <Route path="/app/studio" element={<StudioPage />} />
              <Route path="/app/try-ons/:jobId" element={<TryOnDetailPage />} />
              <Route path="/app/history" element={<HistoryPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )

    // 1. Studio page renders
    expect(await screen.findByRole("heading", { name: "Studio", level: 1 })).toBeInTheDocument()

    // 2. Generate button is enabled because both selections are present in URL
    const generateBtn = await screen.findByRole("button", { name: /Generate Try-On/i })
    expect(generateBtn).toBeEnabled()

    // 3. User submits generation
    fireEvent.click(generateBtn)

    // 4. Navigates to job detail in queued state
    expect(await screen.findByRole("heading", { name: /Waiting to start/i }, { timeout: 10000 })).toBeInTheDocument()
    expect(screen.getByText(/Your try-on request is queued/i)).toBeInTheDocument()

    // 5. Polling update: transition to processing state
    getTryOnSpy.mockResolvedValue(mockProcessingJob)
    await queryClient.invalidateQueries({ queryKey: tryOnKeys.detail(mockQueuedJob.id) })

    expect(await screen.findByRole("heading", { name: /Creating your try-on/i }, { timeout: 10000 })).toBeInTheDocument()

    // 6. Polling update: transition to succeeded state
    getTryOnSpy.mockResolvedValue(mockSucceededJob)
    await queryClient.invalidateQueries({ queryKey: tryOnKeys.detail(mockQueuedJob.id) })

    expect(await screen.findByText(/Your look is ready/i, {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Download look/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /New try-on/i })).toBeInTheDocument()
  })
})
