import { useState } from "react"
import { Shirt01Icon } from "@hugeicons/core-free-icons"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { EmptyState } from "../../components/feedback/empty-state"
import { ImageFrame } from "../../components/image/image-frame"
import { useOutfits } from "../../features/outfits"
import { Button } from "../../components/ui/button"
import { cn } from "../../lib/utils"

export default function OutfitsPage() {
  useDocumentTitle("Outfits")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const { data, isLoading, refetch } = useOutfits({
    category: activeCategory === "all" ? undefined : activeCategory,
  })
  const outfits = data?.items || []

  const categories = [
    { id: "all", label: "All Garments" },
    { id: "tops", label: "Tops" },
    { id: "bottoms", label: "Bottoms" },
    { id: "one-pieces", label: "Dresses" },
    { id: "outerwear", label: "Outerwear" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-zinc-100">Outfit Catalogue</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Browse garments curated for high-fashion diffusion fitting.
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs self-start overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer",
                activeCategory === cat.id
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-lg bg-zinc-900/50 animate-pulse border border-zinc-800/40" />
          ))}
        </div>
      ) : outfits.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={Shirt01Icon}
            title="No outfits in catalogue yet"
            description="The outfit catalogue is currently being populated with high-fashion collections. Check back shortly."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="border-zinc-800 text-zinc-300 cursor-pointer"
              >
                Refresh catalogue
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {outfits.map((outfit) => (
            <div
              key={outfit.id}
              className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950/60 flex flex-col"
            >
              <ImageFrame
                src={outfit.image_url}
                alt={outfit.name}
                aspectRatio="3/4"
              />
              <div className="p-3">
                <p className="text-sm font-medium text-zinc-200 truncate">{outfit.name}</p>
                <p className="text-xs text-zinc-500 capitalize mt-0.5">{outfit.category}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
