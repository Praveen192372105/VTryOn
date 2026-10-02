import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog"
import { Button } from "../ui/button"

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  isPending?: boolean
  destructive?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  isPending = false,
  destructive = false,
}: ConfirmDialogProps) {
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isPending) return
    await onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <AlertDialogHeader className="space-y-2">
          {destructive && (
            <span className="mb-2 inline-flex size-10 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive" aria-hidden="true">
              <HugeiconsIcon icon={Delete02Icon} className="size-5" />
            </span>
          )}
          <AlertDialogTitle className="text-base sm:text-lg font-medium tracking-tight text-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 gap-2.5 sm:flex-row">
          <AlertDialogCancel
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="w-full rounded-lg text-xs sm:w-auto"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            render={
              <Button
                variant={destructive ? "destructive" : "default"}
                size="sm"
                loading={isPending}
                onClick={handleConfirm}
                leadingIcon={destructive ? <HugeiconsIcon icon={Delete02Icon} className="size-4" aria-hidden="true" /> : undefined}
                className={destructive
                  ? "w-full rounded-lg border-destructive bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/40 text-xs font-semibold sm:w-auto"
                  : "w-full rounded-lg text-xs font-medium sm:w-auto"}
              >
                {confirmLabel}
              </Button>
            }
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
