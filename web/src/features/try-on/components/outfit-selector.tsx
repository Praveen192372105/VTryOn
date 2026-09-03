import { useState } from "react"
import { useOutfits } from "../../outfits"
import { ImageFrame } from "../../../components/image/image-frame"
import { cn } from "../../../lib/utils"

interface OutfitSelectorProps {
  selectedId: string | null
  onSelect: (outfitId: string) => void
}

export function OutfitSelector({ selectedId, onSelect }: OutfitSelectorProps) {
  const [category, setCategory] = useState<string>("all")
  const { data, isLoading } = useOutfits({ category: category === "all" ? undefined : category })
  const outfits = data?.items || []

  const categories = [
    { id: "all", label: "All Looks" },
    { id: "tops", label: "Tops" },
    { id: "bottoms", label: "Bottoms" },
    { id: "one-pieces", label: "Dresses" },
    { id: "outerwear", label: "Outerwear" },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-wider font-mono text-zinc-400">
          Step 2 · Select Garment
        </label>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={cn(
              "px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap",
              category === cat.id
                ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-medium"
                : "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-lg bg-zinc-900/50 animate-pulse border border-zinc-800/40" />
          ))}
        </div>
      ) : outfits.length === 0 ? (
        <div className="border border-zinc-800 rounded-lg p-6 text-center bg-zinc-950/40">
          <p className="text-xs font-medium text-zinc-400">No garments found in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {outfits.map((outfit) => {
            const isSelected = selectedId === outfit.id
            return (
              <div
                key={outfit.id}
                onClick={() => onSelect(outfit.id)}
                className={cn(
                  "cursor-pointer rounded-lg transition-all relative group",
                  isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-black" : "hover:opacity-90"
                )}
              >
                <ImageFrame
                  src={outfit.image_url}
                  alt={outfit.name}
                  aspectRatio="3/4"
                  overlay={
                    <span className="text-[11px] font-medium text-white truncate block">
                      {outfit.name}
                    </span>
                  }
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
