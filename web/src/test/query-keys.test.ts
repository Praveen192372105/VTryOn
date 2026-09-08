import { describe, it, expect } from "vitest"
import { authKeys } from "../features/auth/query-keys"
import { uploadKeys } from "../features/uploads/query-keys"
import { outfitKeys } from "../features/outfits/query-keys"
import { favoriteKeys } from "../features/favorites/query-keys"
import { tryOnKeys } from "../features/try-on/query-keys"

describe("Query Key Hierarchical Factories", () => {
  describe("authKeys", () => {
    it("generates stable hierarchical keys", () => {
      expect(authKeys.all).toEqual(["auth"])
      expect(authKeys.me()).toEqual(["auth", "me"])
    })
  })

  describe("uploadKeys", () => {
    it("generates distinct namespaces for list and detail", () => {
      expect(uploadKeys.all).toEqual(["uploads"])
      expect(uploadKeys.lists()).toEqual(["uploads", "list"])
      expect(uploadKeys.details()).toEqual(["uploads", "detail"])
    })

    it("normalizes empty parameters in list queries", () => {
      const keyWithEmpty = uploadKeys.list({})
      const keyWithUndefined = uploadKeys.list(undefined)
      expect(keyWithEmpty).toEqual(keyWithUndefined)
    })

    it("prevents collision between list params and detail IDs", () => {
      const listKey = uploadKeys.list({ page: 1 })
      const detailKey = uploadKeys.detail("1")
      expect(listKey).not.toEqual(detailKey)
      expect(listKey[1]).toBe("list")
      expect(detailKey[1]).toBe("detail")
    })
  })

  describe("outfitKeys", () => {
    it("generates distinct namespaces for list and detail", () => {
      expect(outfitKeys.all).toEqual(["outfits"])
      expect(outfitKeys.lists()).toEqual(["outfits", "list"])
      expect(outfitKeys.details()).toEqual(["outfits", "detail"])
    })

    it("normalizes empty parameters in list queries", () => {
      const keyWithEmpty = outfitKeys.list({})
      const keyWithUndefined = outfitKeys.list(undefined)
      expect(keyWithEmpty).toEqual(keyWithUndefined)
    })

    it("prevents collision between list params and detail IDs", () => {
      const listKey = outfitKeys.list({ category: "upper_body" })
      const detailKey = outfitKeys.detail("upper_body")
      expect(listKey).not.toEqual(detailKey)
      expect(listKey[1]).toBe("list")
      expect(detailKey[1]).toBe("detail")
    })
  })

  describe("favoriteKeys", () => {
    it("generates distinct namespaces", () => {
      expect(favoriteKeys.all).toEqual(["favorites"])
      expect(favoriteKeys.lists()).toEqual(["favorites", "list"])
      expect(favoriteKeys.list({})).toEqual(favoriteKeys.list(undefined))
    })
  })

  describe("tryOnKeys", () => {
    it("generates distinct namespaces for list and detail", () => {
      expect(tryOnKeys.all).toEqual(["try-ons"])
      expect(tryOnKeys.lists()).toEqual(["try-ons", "list"])
      expect(tryOnKeys.details()).toEqual(["try-ons", "detail"])
    })

    it("normalizes empty parameters in list queries", () => {
      const keyWithEmpty = tryOnKeys.list({})
      const keyWithUndefined = tryOnKeys.list(undefined)
      expect(keyWithEmpty).toEqual(keyWithUndefined)
    })

    it("prevents collision between list params and detail IDs", () => {
      const listKey = tryOnKeys.list({ page: 1 })
      const detailKey = tryOnKeys.detail("1")
      expect(listKey).not.toEqual(detailKey)
      expect(listKey[1]).toBe("list")
      expect(detailKey[1]).toBe("detail")
    })
  })
})
