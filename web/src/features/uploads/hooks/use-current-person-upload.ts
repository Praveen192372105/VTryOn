import { useState, useEffect, useCallback } from "react"
import {
  STORAGE_SELECTED_PERSON_KEY,
  EVENT_SELECTED_PERSON_CHANGED,
} from "../constants"
import { usePersonUploads } from "./use-person-uploads"
import type { PersonUpload } from "../types"

function getStoredSelection(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(STORAGE_SELECTED_PERSON_KEY)
  } catch {
    return null
  }
}

/**
 * Global helper to update the selected person upload ID across all components
 * and tabs without tight coupling.
 */
export function setSelectedPersonUploadId(uploadId: string | null): void {
  if (typeof window === "undefined") return
  try {
    if (uploadId) {
      localStorage.setItem(STORAGE_SELECTED_PERSON_KEY, uploadId)
    } else {
      localStorage.removeItem(STORAGE_SELECTED_PERSON_KEY)
    }
    window.dispatchEvent(
      new CustomEvent(EVENT_SELECTED_PERSON_CHANGED, { detail: uploadId })
    )
  } catch {
    // Ignore localStorage write failures (e.g. private browsing mode)
  }
}

/**
 * Global cleanup helper invoked upon user logout or session revocation.
 */
export function clearSelectedPersonUpload(): void {
  setSelectedPersonUploadId(null)
}

/**
 * Hook to read and control the user's active person image selection for Studio try-ons.
 * Automatically validates against the user's active upload library and purges stale/deleted IDs.
 */
export function useCurrentPersonUpload() {
  const [selectedId, setSelectedIdState] = useState<string | null>(getStoredSelection)
  const { uploads, isSuccess } = usePersonUploads()

  // Keep state synced across instances and tabs
  useEffect(() => {
    const handleLocalChange = (event: Event) => {
      const customEvent = event as CustomEvent<string | null>
      setSelectedIdState(customEvent.detail ?? null)
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_SELECTED_PERSON_KEY) {
        setSelectedIdState(event.newValue)
      }
    }

    window.addEventListener(EVENT_SELECTED_PERSON_CHANGED, handleLocalChange)
    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener(EVENT_SELECTED_PERSON_CHANGED, handleLocalChange)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  // Validate persisted selection against loaded uploads: clear if deleted or missing
  useEffect(() => {
    if (isSuccess && selectedId) {
      const exists = uploads.some((u) => u.id === selectedId)
      if (!exists && uploads.length > 0) {
        setSelectedPersonUploadId(null)
      }
    }
  }, [isSuccess, uploads, selectedId])

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedPersonUploadId(id)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedPersonUploadId(null)
  }, [])

  const selectedUpload: PersonUpload | null =
    selectedId ? uploads.find((u) => u.id === selectedId) || null : null

  return {
    selectedId,
    selectedUpload,
    setSelectedId,
    clearSelection,
  }
}
