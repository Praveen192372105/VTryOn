import { useCallback, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { usePersonUploads } from "../../uploads/hooks/use-person-uploads"
import { useOutfit } from "../../outfits/hooks/use-outfits"
import type { PersonUpload } from "../../uploads/types"
import type { OutfitResponse } from "../../outfits/types"

export interface StudioSelection {
  personUploadId: string | null
  outfitId: string | null
  selectedUpload: PersonUpload | null
  selectedOutfit: OutfitResponse | null
  setPersonUploadId: (id: string | null) => void
  setOutfitId: (id: string | null) => void
  clearPersonUpload: () => void
  clearOutfit: () => void
  clearAll: () => void
}

/**
 * Canonical Studio selection hook backed by React Router URL search parameters (?person=...&outfit=...).
 * Benefits:
 * - Refresh-safe and Back/Forward navigation-safe.
 * - Direct-linkable within authenticated session.
 * - Zero cross-user state leaks (no sensitive IDs stored in persistent localStorage).
 * - Automatic self-healing: invalid or deleted uploads/outfits are automatically cleared from the URL.
 */
export function useStudioSelection(): StudioSelection {
  const [searchParams, setSearchParams] = useSearchParams()

  const personUploadId = searchParams.get("person") || null
  const outfitId = searchParams.get("outfit") || null

  // Fetch available uploads to derive the selected PersonUpload object and validate ID
  const { uploads, isSuccess: isUploadsSuccess } = usePersonUploads()
  // Fetch outfit detail if outfitId is present
  const { data: selectedOutfitData, isError: isOutfitError } = useOutfit(outfitId ?? "")

  // Validate personUploadId: if uploads library is loaded and ID is missing, safely clear param
  useEffect(() => {
    if (isUploadsSuccess && personUploadId && uploads.length > 0) {
      const exists = uploads.some((u) => u.id === personUploadId)
      if (!exists) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.delete("person")
            return next
          },
          { replace: true }
        )
      }
    }
  }, [isUploadsSuccess, personUploadId, uploads, setSearchParams])

  // Validate outfitId: if outfit query returns error (e.g. 404 deleted/inactive), safely clear param
  useEffect(() => {
    if (isOutfitError && outfitId) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete("outfit")
          return next
        },
        { replace: true }
      )
    }
  }, [isOutfitError, outfitId, setSearchParams])

  const setPersonUploadId = useCallback(
    (id: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id && id.trim().length > 0) {
            next.set("person", id.trim())
          } else {
            next.delete("person")
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const setOutfitId = useCallback(
    (id: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id && id.trim().length > 0) {
            next.set("outfit", id.trim())
          } else {
            next.delete("outfit")
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const clearPersonUpload = useCallback(() => {
    setPersonUploadId(null)
  }, [setPersonUploadId])

  const clearOutfit = useCallback(() => {
    setOutfitId(null)
  }, [setOutfitId])

  const clearAll = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete("person")
        next.delete("outfit")
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  const selectedUpload: PersonUpload | null =
    personUploadId ? uploads.find((u) => u.id === personUploadId) || null : null

  const selectedOutfit: OutfitResponse | null = selectedOutfitData ?? null

  return {
    personUploadId,
    outfitId,
    selectedUpload,
    selectedOutfit,
    setPersonUploadId,
    setOutfitId,
    clearPersonUpload,
    clearOutfit,
    clearAll,
  }
}
