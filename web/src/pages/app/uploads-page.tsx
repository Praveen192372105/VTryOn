import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon, Cancel01Icon, ShieldCheckIcon } from "@hugeicons/core-free-icons"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { PageHeader, SectionShell } from "../../components/layout"
import { Button } from "../../components/ui/button"
import { ROUTES } from "../../app/route-paths"
import {
  usePersonUploads,
  useCreatePersonUpload,
  useDeleteUpload,
  useCurrentPersonUpload,
  validatePersonImagePreDecode,
  validatePersonImagePostDecode,
  decodeImageMetadata,
  safeRevokeObjectUrl,
  PersonUploadDropzone,
  PersonUploadPreview,
  UploadGrid,
  UploadDeleteDialog,
  type DecodedImageMetadata,
  type ValidationResult,
} from "../../features/uploads"

export default function UploadsPage() {
  useDocumentTitle("Your Photos")
  const navigate = useNavigate()

  // Queries & Mutations
  const { uploads, isLoading, isError, error, refetch } = usePersonUploads()
  const uploadMutation = useCreatePersonUpload()
  const deleteMutation = useDeleteUpload()
  const { selectedId, setSelectedId } = useCurrentPersonUpload()

  // Upload UI State
  const [isAddMode, setIsAddMode] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [decodedMeta, setDecodedMeta] = useState<DecodedImageMetadata | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null)

  // Deletion Dialog State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // Version counter to prevent async decode race conditions
  const decodeVersionRef = useRef(0)

  // Object URL lifecycle cleanup on unmount or file reset
  useEffect(() => {
    return () => {
      if (previewUrl) {
        safeRevokeObjectUrl(previewUrl)
      }
    }
  }, [previewUrl])

  const handleClearUploadFlow = () => {
    if (previewUrl) {
      safeRevokeObjectUrl(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setDecodedMeta(null)
    setValidationResult(null)
    setUploadErrorMessage(null)
    setIsAddMode(false)
  }

  const handleFileSelected = async (file: File) => {
    setUploadErrorMessage(null)
    const currentVersion = ++decodeVersionRef.current

    // 1. Revoke previous preview URL if any
    if (previewUrl) {
      safeRevokeObjectUrl(previewUrl)
      setPreviewUrl(null)
    }

    setSelectedFile(file)
    setIsAddMode(true)

    // 2. Early client validation
    const preCheck = validatePersonImagePreDecode(file)
    if (!preCheck.isValid) {
      setValidationResult(preCheck)
      setDecodedMeta(null)
      return
    }

    // 3. Local object URL preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // 4. Browser dimension decode
    try {
      const metadata = await decodeImageMetadata(file)
      // Check if another file was selected while decoding
      if (currentVersion !== decodeVersionRef.current) return

      setDecodedMeta(metadata)
      const postCheck = validatePersonImagePostDecode(metadata)
      setValidationResult(postCheck)
    } catch {
      if (currentVersion !== decodeVersionRef.current) return
      setDecodedMeta(null)
      setValidationResult({
        isValid: false,
        errors: [
          {
            code: "decode-failed",
            severity: "error",
            message: "We couldn't read this image. Choose another JPEG, PNG or WebP file.",
          },
        ],
        warnings: [],
        issues: [],
      })
    }
  }

  const handleUploadConfirm = async () => {
    if (!selectedFile || !validationResult?.isValid) return
    setUploadErrorMessage(null)

    try {
      await uploadMutation.mutateAsync(selectedFile)
      // Upload succeeded and was auto-selected as current person
      handleClearUploadFlow()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload photo."
      setUploadErrorMessage(msg)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return
    try {
      await deleteMutation.mutateAsync(deleteTargetId)
      setDeleteTargetId(null)
    } catch {
      // Error surfaced through hook toast; dialog remains open or user can retry
    }
  }

  const handleUseInStudio = (uploadId: string) => {
    setSelectedId(uploadId)
    navigate(ROUTES.app.studioWithParams({ person: uploadId }))
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your photos"
        description="Photos available for virtual try-ons."
        actions={
          <Button
            size="sm"
            variant={isAddMode ? "outline" : "default"}
            onClick={() => {
              if (isAddMode) {
                handleClearUploadFlow()
              } else {
                setIsAddMode(true)
              }
            }}
            leadingIcon={
              <HugeiconsIcon
                icon={isAddMode ? Cancel01Icon : PlusSignIcon}
                className="size-4"
              />
            }
          >
            {isAddMode ? "Cancel" : "Add photo"}
          </Button>
        }
      />

      {/* Inline Upload Workspace when Add Mode is active */}
      {isAddMode && (
        <SectionShell className="p-6 sm:p-8 bg-surface border border-border rounded-2xl shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                {selectedFile ? "Preview & framing guidance" : "Select a portrait photo"}
              </h2>
              <button
                type="button"
                onClick={handleClearUploadFlow}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {!selectedFile || !validationResult ? (
              <PersonUploadDropzone
                onFileSelected={handleFileSelected}
                disabled={uploadMutation.isPending}
              />
            ) : (
              <PersonUploadPreview
                file={selectedFile}
                previewUrl={previewUrl || ""}
                metadata={decodedMeta}
                validation={validationResult}
                onConfirm={handleUploadConfirm}
                onReselect={() => {
                  if (previewUrl) safeRevokeObjectUrl(previewUrl)
                  setSelectedFile(null)
                  setPreviewUrl(null)
                  setDecodedMeta(null)
                  setValidationResult(null)
                  setUploadErrorMessage(null)
                }}
                isUploading={uploadMutation.isPending}
                uploadError={uploadErrorMessage}
              />
            )}
          </div>
        </SectionShell>
      )}

      {/* Library Grid */}
      <section aria-label="Photo library" className="space-y-4">
        <UploadGrid
          uploads={uploads}
          selectedId={selectedId}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onSelect={setSelectedId}
          onDelete={(id) => setDeleteTargetId(id)}
          onUseInStudio={handleUseInStudio}
          onUploadClick={() => setIsAddMode(true)}
          onRetry={() => refetch()}
        />
      </section>

      {/* Privacy Notice */}
      <div className="pt-6 border-t border-border/60 flex items-center gap-2.5 text-xs text-muted-foreground">
        <HugeiconsIcon icon={ShieldCheckIcon} className="size-4 text-muted-foreground shrink-0" />
        <span>
          Your uploaded photos are private to your account and are used exclusively for your try-on experience.
        </span>
      </div>

      {/* Safe Deletion Dialog */}
      <UploadDeleteDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null)
        }}
        isPending={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
