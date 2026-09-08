import { HugeiconsIcon } from "@hugeicons/react"
import {
  Download01Icon,
  Shirt01Icon,
  PlusSignIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "../../../components/ui/button"
import { cn } from "../../../lib/utils"

export interface ResultActionsProps {
  onTryAnotherOutfit: () => void
  onCreateAnother: () => void
  onDownload: () => void
  isDownloading?: boolean
  canDownload?: boolean
  className?: string
}

export function ResultActions({
  onTryAnotherOutfit,
  onCreateAnother,
  onDownload,
  isDownloading = false,
  canDownload = true,
  className,
}: ResultActionsProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 sm:gap-3", className)}>
      <Button
        variant="outline"
        onClick={onTryAnotherOutfit}
        className="gap-2 text-xs font-medium cursor-pointer w-full justify-center"
      >
        <HugeiconsIcon icon={Shirt01Icon} className="size-3.5" />
        <span>Try another outfit</span>
      </Button>

      <Button
        variant="outline"
        onClick={onCreateAnother}
        className="gap-2 text-xs font-medium cursor-pointer w-full justify-center"
      >
        <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
        <span>New try-on</span>
      </Button>

      <Button
        onClick={onDownload}
        disabled={!canDownload || isDownloading}
        className="gap-2 text-xs font-medium cursor-pointer w-full justify-center"
      >
        {isDownloading ? (
          <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
        ) : (
          <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
        )}
        <span>{isDownloading ? "Downloading…" : "Download look"}</span>
      </Button>
    </div>
  )
}
