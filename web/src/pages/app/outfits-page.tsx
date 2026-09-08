import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Upload01Icon } from "@hugeicons/core-free-icons"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { PageHeader } from "../../components/layout"
import { Button } from "../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog"
import {
  useOutfits,
  useOutfitFilters,
  useCurrentOutfit,
  OutfitFilters,
  OutfitGrid,
  OutfitPagination,
  OutfitDetailPanel,
  GarmentUploadDropzone,
  DEFAULT_OUTFIT_PAGE_SIZE,
  type OutfitListItem,
  type OutfitResponse,
} from "../../features/outfits"
import { ROUTES } from "../../app/route-paths"

export default function OutfitsPage() {
  useDocumentTitle("Outfits")
  const navigate = useNavigate()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const {
    category,
    page,
    search,
    detailOutfitId,
    setCategory,
    setPage,
    setSearch,
    setDetailOutfitId,
    clearFilters,
  } = useOutfitFilters()

  const { data, isLoading, isError, error, refetch } = useOutfits({
    category,
    page,
    search,
    page_size: DEFAULT_OUTFIT_PAGE_SIZE,
  })

  const { selectedId: selectedStudioOutfitId, setSelectedId: setSelectedStudioOutfitId } =
    useCurrentOutfit()

  const outfits = data?.items || []
  const pagination = data?.pagination

  const handleSelectForStudio = (outfit: OutfitListItem | OutfitResponse) => {
    setSelectedStudioOutfitId(outfit.id)
    navigate(ROUTES.app.studioWithParams({ outfit: outfit.id }))
  }

  // Determine contextual empty state message and action
  let emptyTitle = "No outfits are available right now."
  let emptyDescription = "The catalogue is currently empty. Check back soon for newly curated garments."
  let emptyAction: React.ReactNode = (
    <Button variant="outline" size="sm" onClick={() => refetch()}>
      Refresh
    </Button>
  )

  if (search) {
    emptyTitle = `No outfits matched “${search}”`
    emptyDescription = "Try checking for spelling errors or searching for broader garment terms."
    emptyAction = (
      <Button variant="outline" size="sm" onClick={() => setSearch(undefined)}>
        Clear search
      </Button>
    )
  } else if (category) {
    emptyTitle = "No outfits found in this category."
    emptyDescription = "There are no active outfits listed under this category filter."
    emptyAction = (
      <Button variant="outline" size="sm" onClick={() => clearFilters()}>
        View all outfits
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outfits"
        description="Explore garments and choose one for your next try-on, or upload your own."
        actions={
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            className="gap-1.5 text-xs shadow-xs"
          >
            <HugeiconsIcon icon={Upload01Icon} className="size-3.5" />
            <span>Upload Garment</span>
          </Button>
        }
      />

      {/* URL-Synchronized Category & Search Controls */}
      <OutfitFilters
        selectedCategory={category}
        onCategoryChange={setCategory}
        searchTerm={search}
        onSearchChange={setSearch}
      />

      {/* Image-led Garment Grid */}
      <OutfitGrid
        outfits={outfits}
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        selectedStudioOutfitId={selectedStudioOutfitId}
        onOpenDetail={setDetailOutfitId}
        onSelectForStudio={handleSelectForStudio}
        onRetry={() => refetch()}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyAction={emptyAction}
      />

      {/* Server Pagination */}
      {pagination && (
        <OutfitPagination
          currentPage={pagination.page}
          totalPages={pagination.total_pages}
          totalItems={pagination.total}
          onPageChange={setPage}
        />
      )}

      {/* URL-backed Side Panel Detail */}
      <OutfitDetailPanel
        outfitId={detailOutfitId}
        isSelectedForStudio={selectedStudioOutfitId === detailOutfitId}
        onClose={() => setDetailOutfitId(null)}
        onSelectForStudio={handleSelectForStudio}
      />

      {/* Custom Garment Upload Modal Dialog */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-xl p-6 rounded-2xl bg-surface border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Upload Your Own Garment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload a clothing item to try on in the Studio or keep in your catalogue.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <GarmentUploadDropzone
              onSuccess={(outfit) => {
                setIsUploadModalOpen(false)
                handleSelectForStudio(outfit)
              }}
              onCancel={() => setIsUploadModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
