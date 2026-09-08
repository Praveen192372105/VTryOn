import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { PageHeader } from "../../components/layout"
import { buttonVariants } from "../../components/ui/button"
import { useFavorites } from "../../features/favorites"
import {
  OutfitGrid,
  OutfitPagination,
  OutfitDetailPanel,
  useCurrentOutfit,
  type OutfitListItem,
  type OutfitResponse,
} from "../../features/outfits"
import { ROUTES } from "../../app/route-paths"
import { cn } from "../../lib/utils"

export default function FavoritesPage() {
  useDocumentTitle("Favorites")
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [detailOutfitId, setDetailOutfitId] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } = useFavorites({
    page: currentPage,
    page_size: 24,
  })

  const { selectedId: selectedStudioOutfitId, setSelectedId: setSelectedStudioOutfitId } =
    useCurrentOutfit()

  const favoriteItems = data?.items || []
  // Extract outfits from FavoriteItemResponse
  const outfits: OutfitListItem[] = favoriteItems.map((item) => item.outfit)
  const pagination = data?.pagination

  const handleSelectForStudio = (outfit: OutfitListItem | OutfitResponse) => {
    setSelectedStudioOutfitId(outfit.id)
    navigate(ROUTES.app.studioWithParams({ outfit: outfit.id }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Favorites"
        description="Outfits you've saved for later."
      />

      <OutfitGrid
        outfits={outfits}
        isLoading={isLoading}
        isError={isError}
        error={error as Error}
        selectedStudioOutfitId={selectedStudioOutfitId}
        onOpenDetail={setDetailOutfitId}
        onSelectForStudio={handleSelectForStudio}
        onRetry={() => refetch()}
        emptyTitle="No saved outfits yet."
        emptyDescription="Save outfits you want to revisit and they’ll appear here."
        emptyAction={
          <Link
            to={ROUTES.app.outfits}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Browse outfits
          </Link>
        }
      />

      {pagination && (
        <OutfitPagination
          currentPage={pagination.page}
          totalPages={pagination.total_pages}
          totalItems={pagination.total}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Outfit Detail Panel */}
      <OutfitDetailPanel
        outfitId={detailOutfitId}
        isSelectedForStudio={selectedStudioOutfitId === detailOutfitId}
        onClose={() => setDetailOutfitId(null)}
        onSelectForStudio={handleSelectForStudio}
      />
    </div>
  )
}
