import { Link } from "react-router-dom"
import { FavouriteIcon } from "@hugeicons/core-free-icons"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { EmptyState } from "../../components/feedback/empty-state"
import { ImageFrame } from "../../components/image/image-frame"
import { useFavorites } from "../../features/favorites"
import { buttonVariants } from "../../components/ui/button"
import { ROUTES } from "../../app/route-paths"
import { cn } from "../../lib/utils"

export default function FavoritesPage() {
  useDocumentTitle("Favorites")
  const { data, isLoading } = useFavorites()
  const favorites = data?.items || []

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-zinc-900">
        <h1 className="text-2xl font-light tracking-tight text-zinc-100">Saved Looks</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Your curated wardrobe collection for quick virtual try-on access.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-lg bg-zinc-900/50 animate-pulse border border-zinc-800/40" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={FavouriteIcon}
            title="No favorites saved yet"
            description="Save outfits you love from the catalogue to quickly try them on anytime."
            action={
              <Link
                to={ROUTES.outfits}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-zinc-800 text-zinc-300")}
              >
                Explore catalogue
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {favorites.map((outfit) => (
            <div
              key={outfit.id}
              className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950/60"
            >
              <ImageFrame
                src={outfit.image_url}
                alt={outfit.name}
                aspectRatio="3/4"
              />
              <div className="p-3">
                <p className="text-sm font-medium text-zinc-200 truncate">{outfit.name}</p>
                <p className="text-xs text-zinc-500 capitalize">{outfit.category}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
