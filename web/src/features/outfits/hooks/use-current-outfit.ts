import { useState, useEffect, useCallback } from "react"
import {
  STORAGE_SELECTED_OUTFIT_KEY,
  EVENT_SELECTED_OUTFIT_CHANGED,
} from "../constants"
import { useOutfit } from "./use-outfits"

function getStoredSelection(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(STORAGE_SELECTED_OUTFIT_KEY)
  } catch {
    return null
  }
}

/**
 * Global helper to update the selected outfit ID across all components
 * and tabs without tight coupling.
 */
export function setSelectedOutfitId(outfitId: string | null): void {
  if (typeof window === "undefined") return
  try {
    if (outfitId) {
      localStorage.setItem(STORAGE_SELECTED_OUTFIT_KEY, outfitId)
    } else {
      localStorage.removeItem(STORAGE_SELECTED_OUTFIT_KEY)
    }
    window.dispatchEvent(
      new CustomEvent(EVENT_SELECTED_OUTFIT_CHANGED, { detail: outfitId })
    )
  } catch {
    // Ignore localStorage write failures (e.g. private browsing mode)
  }
}

/**
 * Global cleanup helper invoked upon user logout or session revocation.
 */
export function clearSelectedOutfit(): void {
  setSelectedOutfitId(null)
}

/**
 * Hook to read and control the user's active outfit selection for Studio try-ons.
 */
export function useCurrentOutfit() {
  const [selectedId, setSelectedIdState] = useState<string | null>(getStoredSelection)

  // Keep state synced across instances and tabs
  useEffect(() => {
    const handleLocalChange = (event: Event) => {
      const customEvent = event as CustomEvent<string | null>
      setSelectedIdState(customEvent.detail ?? null)
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_SELECTED_OUTFIT_KEY) {
        setSelectedIdState(event.newValue)
      }
    }

    window.addEventListener(EVENT_SELECTED_OUTFIT_CHANGED, handleLocalChange)
    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener(EVENT_SELECTED_OUTFIT_CHANGED, handleLocalChange)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedOutfitId(id)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedOutfitId(null)
  }, [])

  // Retrieve full outfit record if selectedId is set
  const { data: selectedOutfit, isError } = useOutfit(selectedId ?? "")

  // If outfit is deleted/inactive (404), safely self-heal and clear stale selection
  useEffect(() => {
    if (isError && selectedId) {
      clearSelectedOutfit()
    }
  }, [isError, selectedId])

  return {
    selectedId,
    selectedOutfit: selectedOutfit ?? null,
    setSelectedId,
    clearSelection,
  }
}
