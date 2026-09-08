import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon, InformationCircleIcon } from "@hugeicons/core-free-icons"
import { motion, useReducedMotion } from "motion/react"
import { ImageFrame } from "@/components/image"
import { Button } from "@/components/ui/button"
import { FramingGuidance, FramingTipsCard } from "./framing-guidance"
import { cn } from "@/lib/utils"
import type { DecodedImageMetadata, ValidationResult } from "../types"

export interface PersonUploadPreviewProps {
  file: File
  previewUrl: string
  metadata: DecodedImageMetadata | null
  validation: ValidationResult
  onConfirm: () => void
  onReselect: () => void
  isUploading?: boolean
  uploadError?: string | null
  className?: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function PersonUploadPreview({
  file,
  previewUrl,
  metadata,
  validation,
  onConfirm,
  onReselect,
  isUploading = false,
  uploadError,
  className,
}: PersonUploadPreviewProps) {
  const hasErrors = validation.errors.length > 0
  const hasWarnings = validation.warnings.length > 0 && !hasErrors
  const fileSizeFormatted = formatBytes(file.size)

  const shouldReduceMotion = useReducedMotion()

  return (
    <div className={cn("w-full space-y-6", className)}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Dominant Image Preview with Non-Destructive Framing Guidance */}
        <div className="md:col-span-7 flex justify-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0.85, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.24,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-full max-w-sm rounded-2xl overflow-hidden border border-border/80 bg-surface relative shadow-sm"
          >
            <ImageFrame
              src={previewUrl}
              alt="Your selected person photo"
              aspectRatio="3/4"
              objectFit="contain"
              overlay={
                <FramingGuidance
                  metadata={metadata}
                  fileSizeFormatted={fileSizeFormatted}
                  fileName={file.name}
                />
              }
            />
          </motion.div>
        </div>

        {/* Metadata, Validation Notices & Action Controls */}
        <div className="md:col-span-5 space-y-4">
          {/* Photo Summary Details */}
          <div className="rounded-xl border border-border/70 bg-surface p-4 space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Selected Photo
            </h4>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                {file.name}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
                <span>{fileSizeFormatted}</span>
                {metadata && (
                  <>
                    <span>·</span>
                    <span>
                      {metadata.width} × {metadata.height} px
                    </span>
                  </>
                )}
                <span>·</span>
                <span className="uppercase">{file.type.replace("image/", "")}</span>
              </div>
            </div>
          </div>

          {/* Blocking Validation Errors */}
          {hasErrors && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 space-y-1.5 text-xs text-danger"
            >
              <div className="flex items-center gap-1.5 font-medium">
                <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0" />
                <span>Upload blocked</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                {validation.errors.map((err, idx) => (
                  <li key={idx}>{err.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Non-Blocking Guidance Warnings */}
          {hasWarnings && (
            <div
              role="status"
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1.5 text-xs text-amber-700 dark:text-amber-400"
            >
              <div className="flex items-center gap-1.5 font-medium">
                <HugeiconsIcon icon={InformationCircleIcon} className="size-4 shrink-0" />
                <span>Framing suggestion</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                {validation.warnings.map((warn, idx) => (
                  <li key={idx}>{warn.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Server Upload Error */}
          {uploadError && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 flex items-start gap-2 text-xs text-danger"
            >
              <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Framing Tips */}
          <FramingTipsCard />

          {/* Action Affordances */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Button
              type="button"
              onClick={onConfirm}
              disabled={hasErrors || isUploading}
              loading={isUploading}
              className="flex-1"
            >
              {isUploading ? "Uploading photo…" : "Use this photo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onReselect}
              disabled={isUploading}
            >
              Choose another
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
