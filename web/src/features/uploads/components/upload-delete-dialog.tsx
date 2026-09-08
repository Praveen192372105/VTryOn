import { ConfirmDialog } from "@/components/feedback"

export interface UploadDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  isPending?: boolean
}

export function UploadDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: UploadDeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete this photo?"
      description="This removes the photo from your V Try-On library. If an active try-on still depends on it, deletion may be unavailable."
      confirmLabel="Delete photo"
      cancelLabel="Cancel"
      isPending={isPending}
      onConfirm={onConfirm}
    />
  )
}
