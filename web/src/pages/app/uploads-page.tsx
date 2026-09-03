import { useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon, PlusSignIcon, Delete02Icon } from "@hugeicons/core-free-icons"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { EmptyState } from "../../components/feedback/empty-state"
import { ImageFrame } from "../../components/image/image-frame"
import { useUploads, useUploadImage, useDeleteUpload } from "../../features/uploads"
import { Button } from "../../components/ui/button"
import { Spinner } from "../../components/ui/spinner"

export default function UploadsPage() {
  useDocumentTitle("Portrait Uploads")
  const { data, isLoading } = useUploads()
  const uploadMutation = useUploadImage()
  const deleteMutation = useDeleteUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploads = data?.items || []

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadMutation.mutate(file)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-zinc-100">Your Portraits</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Manage your personal portrait photos used for virtual fitting.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="bg-zinc-100 text-zinc-950 hover:bg-white font-medium gap-2 cursor-pointer"
          >
            {uploadMutation.isPending ? (
              <>
                <Spinner className="w-3.5 h-3.5 text-zinc-950" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
                <span>Upload portrait</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-lg bg-zinc-900/50 animate-pulse border border-zinc-800/40" />
          ))}
        </div>
      ) : uploads.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={Camera01Icon}
            title="No portrait photos yet"
            description="Upload a full-body portrait or upper-body photo to begin realistic garment fitting."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-zinc-800 text-zinc-300 cursor-pointer"
              >
                Upload your first photo
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950/60 relative group"
            >
              <ImageFrame
                src={upload.public_url || upload.storage_path}
                alt={upload.original_filename}
                aspectRatio="3/4"
                actions={
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(upload.id)}
                    className="p-1.5 rounded-full bg-black/70 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 border border-zinc-700/60 transition-colors cursor-pointer"
                    title="Delete photo"
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="w-3.5 h-3.5" />
                  </button>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
