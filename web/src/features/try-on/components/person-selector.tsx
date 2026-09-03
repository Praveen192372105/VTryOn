import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { useUploads } from "../../uploads"
import { ImageFrame } from "../../../components/image/image-frame"
import { cn } from "../../../lib/utils"

interface PersonSelectorProps {
  selectedId: string | null
  onSelect: (uploadId: string) => void
  onUploadClick?: () => void
}

export function PersonSelector({ selectedId, onSelect, onUploadClick }: PersonSelectorProps) {
  const { data, isLoading } = useUploads()
  const uploads = data?.items || []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-wider font-mono text-zinc-400">
          Step 1 · Select Your Photo
        </label>
        {onUploadClick && (
          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="w-3.5 h-3.5" />
            <span>Upload new</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-lg bg-zinc-900/50 animate-pulse border border-zinc-800/40" />
          ))}
        </div>
      ) : uploads.length === 0 ? (
        <div
          onClick={onUploadClick}
          className="border border-dashed border-zinc-800 rounded-lg p-6 text-center hover:border-zinc-700 transition-colors cursor-pointer group bg-zinc-950/40"
        >
          <HugeiconsIcon icon={Camera01Icon} className="w-8 h-8 text-zinc-600 group-hover:text-zinc-400 mx-auto mb-2 transition-colors" />
          <p className="text-xs font-medium text-zinc-300">No photos uploaded yet</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Click to upload your portrait to begin</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {uploads.map((upload) => {
            const isSelected = selectedId === upload.id
            return (
              <div
                key={upload.id}
                onClick={() => onSelect(upload.id)}
                className={cn(
                  "cursor-pointer rounded-lg transition-all relative group",
                  isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-black" : "hover:opacity-90"
                )}
              >
                <ImageFrame
                  src={upload.public_url || upload.storage_path}
                  alt={upload.original_filename}
                  aspectRatio="3/4"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
