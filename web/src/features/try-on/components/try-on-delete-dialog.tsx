import { ConfirmDialog } from "../../../components/feedback/confirm-dialog"

export interface TryOnDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  isPending?: boolean
}

export function TryOnDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: TryOnDeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete this try-on?"
      description="This removes it from your history and removes its generated result. This action cannot be undone."
      confirmLabel="Delete try-on"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      isPending={isPending}
      destructive={true}
    />
  )
}
