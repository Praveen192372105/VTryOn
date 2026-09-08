import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import { QueryClient } from "@tanstack/react-query"
import { clearPrivateQueryState } from "@/app/query-client"
import { authKeys } from "@/features/auth/query-keys"
import { uploadKeys } from "@/features/uploads/query-keys"
import { outfitKeys } from "@/features/outfits/query-keys"
import { favoriteKeys } from "@/features/favorites/query-keys"
import { tryOnKeys } from "@/features/try-on/query-keys"

const SRC_DIR = path.resolve(__dirname, "../../src")

function getAllSourceFiles(dir: string): string[] {
  let results: string[] = []
  const list = fs.readdirSync(dir)

  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat && stat.isDirectory()) {
      results = results.concat(getAllSourceFiles(filePath))
    } else if (/\.(ts|tsx)$/.test(file)) {
      results.push(filePath)
    }
  }

  return results
}

describe("State Ownership & Data Fetching Architecture Tests", () => {
  const allFiles = getAllSourceFiles(SRC_DIR)

  it("enforces exactly 1 QueryClient instantiation in application source", () => {
    const productionFiles = allFiles.filter((file) => {
      const normalized = file.replace(/\\/g, "/")
      return !normalized.includes("__tests__") && !normalized.includes("/test/")
    })

    const instances: string[] = []
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf-8")
      if (content.match(/new\s+QueryClient\s*\(/)) {
        instances.push(path.relative(SRC_DIR, file).replace(/\\/g, "/"))
      }
    }

    expect(instances).toEqual(["app/query-client.ts"])
  })

  it("prohibits server state feature contexts (UploadsContext, OutfitsContext, etc.)", () => {
    const bannedContexts = [
      /UploadsContext\b/,
      /OutfitsContext\b/,
      /FavoritesContext\b/,
      /HistoryContext\b/,
      /TryOnContext\b/,
      /JobsContext\b/,
      /AppContext\b/,
    ]

    const violations: { file: string; context: string }[] = []

    for (const file of allFiles) {
      if (file.includes("__tests__")) continue
      const content = fs.readFileSync(file, "utf-8")

      for (const pattern of bannedContexts) {
        if (pattern.test(content)) {
          violations.push({
            file: path.relative(SRC_DIR, file).replace(/\\/g, "/"),
            context: pattern.source,
          })
        }
      }
    }

    expect(violations).toEqual([])
  })

  it("prohibits sessionStorage usage across the entire frontend source", () => {
    const violations: string[] = []

    for (const file of allFiles) {
      if (file.includes("__tests__")) continue
      const content = fs.readFileSync(file, "utf-8")
      if (content.includes("sessionStorage")) {
        violations.push(path.relative(SRC_DIR, file).replace(/\\/g, "/"))
      }
    }

    expect(violations).toEqual([])
  })

  it("prohibits raw query key arrays in production data-fetching hooks", () => {
    const hookFiles = allFiles.filter((file) => {
      const normalized = file.replace(/\\/g, "/")
      return (
        normalized.includes("/hooks/") &&
        !normalized.includes("__tests__") &&
        /\.tsx?$/.test(file)
      )
    })

    const rawKeyViolations: string[] = []

    for (const file of hookFiles) {
      const content = fs.readFileSync(file, "utf-8")
      // Check for raw literal arrays like queryKey: ["uploads"] or queryKey: ["outfits"]
      if (content.match(/queryKey:\s*\[\s*["'](uploads|outfits|favorites|try-ons|auth)["']/)) {
        rawKeyViolations.push(path.relative(SRC_DIR, file).replace(/\\/g, "/"))
      }
    }

    expect(rawKeyViolations).toEqual([])
  })

  it("verifies clearPrivateQueryState completely purges user-scoped caches", async () => {
    const testClient = new QueryClient()

    // Seed mock data for all user-scoped caches
    testClient.setQueryData(authKeys.me(), { id: "usr_1", email: "a@example.com" })
    testClient.setQueryData(uploadKeys.lists(), { items: [{ id: "upl_1" }] })
    testClient.setQueryData(outfitKeys.lists(), { items: [{ id: "out_1", is_favorite: true }] })
    testClient.setQueryData(favoriteKeys.lists(), { items: [{ id: "fav_1" }] })
    testClient.setQueryData(tryOnKeys.lists(), { items: [{ id: "job_1" }] })

    // Verify seeded state exists
    expect(testClient.getQueryData(authKeys.me())).toBeDefined()
    expect(testClient.getQueryData(uploadKeys.lists())).toBeDefined()
    expect(testClient.getQueryData(outfitKeys.lists())).toBeDefined()
    expect(testClient.getQueryData(favoriteKeys.lists())).toBeDefined()
    expect(testClient.getQueryData(tryOnKeys.lists())).toBeDefined()

    // Trigger clearPrivateQueryState
    await clearPrivateQueryState(testClient)

    // Assert all private query caches are completely removed
    expect(testClient.getQueryData(authKeys.me())).toBeUndefined()
    expect(testClient.getQueryData(uploadKeys.lists())).toBeUndefined()
    expect(testClient.getQueryData(outfitKeys.lists())).toBeUndefined()
    expect(testClient.getQueryData(favoriteKeys.lists())).toBeUndefined()
    expect(testClient.getQueryData(tryOnKeys.lists())).toBeUndefined()
  })
})
