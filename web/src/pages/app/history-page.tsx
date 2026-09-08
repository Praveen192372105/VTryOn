import { useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { useDocumentTitle } from "../../hooks/use-document-title"
import {
  useTryOnHistory,
  TryOnHistoryGrid,
  TryOnPagination,
  DEFAULT_TRY_ON_PAGE_SIZE,
} from "../../features/try-on"
import { PageHeader } from "../../components/layout"
import { Button } from "../../components/ui/button"
import { ROUTES } from "../../app/route-paths"

export default function HistoryPage() {
  useDocumentTitle("Try-On History")
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Parse and normalize page parameter from URL search query
  const rawPage = parseInt(searchParams.get("page") || "1", 10)
  const currentPage = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1

  const { data, isLoading, isError, error, refetch } = useTryOnHistory({
    page: currentPage,
    page_size: DEFAULT_TRY_ON_PAGE_SIZE,
  })

  const jobs = data?.items || []
  const totalPages = data?.pagination?.total_pages ?? data?.meta?.total_pages ?? 1
  const totalItems = data?.pagination?.total ?? data?.meta?.total

  // Normalize boundary: if current page exceeds total pages (e.g. after deletion), step back
  useEffect(() => {
    if (data && totalPages > 0 && currentPage > totalPages) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (totalPages === 1) {
          next.delete("page")
        } else {
          next.set("page", totalPages.toString())
        }
        return next
      })
    }
  }, [data, totalPages, currentPage, setSearchParams])

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (newPage === 1) {
        next.delete("page")
      } else {
        next.set("page", newPage.toString())
      }
      return next
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="History"
        description="Your recent virtual try-ons."
        actions={
          <Button
            size="sm"
            onClick={() => navigate(ROUTES.app.studio)}
            className="gap-1.5 text-xs font-medium cursor-pointer"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
            <span>New try-on</span>
          </Button>
        }
      />

      <TryOnHistoryGrid
        jobs={jobs}
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        onRetry={() => refetch()}
      />

      {!isLoading && !isError && jobs.length > 0 && (
        <TryOnPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}
