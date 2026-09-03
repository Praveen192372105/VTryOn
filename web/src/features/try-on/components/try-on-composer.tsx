import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon } from "@hugeicons/core-free-icons"
import { PersonSelector } from "./person-selector"
import { OutfitSelector } from "./outfit-selector"
import { useCreateTryOn } from "../hooks/use-create-try-on"
import { Button } from "../../../components/ui/button"
import { Spinner } from "../../../components/ui/spinner"
import type { TryOnJob } from "../types"

interface TryOnComposerProps {
  onJobCreated?: (job: TryOnJob) => void
}

export function TryOnComposer({ onJobCreated }: TryOnComposerProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null)

  const createMutation = useCreateTryOn()

  const handleGenerate = async () => {
    if (!selectedPersonId || !selectedOutfitId) return

    try {
      const job = await createMutation.mutateAsync({
        person_upload_id: selectedPersonId,
        outfit_id: selectedOutfitId,
      })
      onJobCreated?.(job)
    } catch {
      // Error handled via mutation state and central client toast
    }
  }

  const isSubmitting = createMutation.isPending
  const canSubmit = Boolean(selectedPersonId && selectedOutfitId && !isSubmitting)

  return (
    <div className="space-y-8 bg-zinc-950 border border-zinc-800/80 rounded-xl p-6 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PersonSelector
          selectedId={selectedPersonId}
          onSelect={setSelectedPersonId}
        />
        <OutfitSelector
          selectedId={selectedOutfitId}
          onSelect={setSelectedOutfitId}
        />
      </div>

      <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-zinc-500 font-mono">
          {selectedPersonId && selectedOutfitId
            ? "Ready to synthesize fit"
            : "Select both a portrait and a garment to begin"}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!canSubmit}
          size="lg"
          className="w-full sm:w-auto bg-zinc-100 text-zinc-950 hover:bg-white px-8 font-medium gap-2 disabled:opacity-40"
        >
          {isSubmitting ? (
            <>
              <Spinner className="w-4 h-4 text-zinc-950" />
              <span>Submitting request...</span>
            </>
          ) : (
            <>
              <HugeiconsIcon icon={SparklesIcon} className="w-4 h-4" />
              <span>Generate Virtual Look</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
