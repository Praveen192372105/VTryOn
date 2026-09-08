import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import {
  mockQueuedJob,
  mockProcessingJob,
  mockSucceededJob,
  mockFailedJob,
} from "../../src/test/fixtures/try-on-fixtures"

const ROOT_DIR = path.resolve(__dirname, "../../")
const SRC_DIR = path.resolve(ROOT_DIR, "src")
const TESTS_DIR = path.resolve(ROOT_DIR, "tests")

describe("Testing Strategy Architecture Tests (Phase 21)", () => {
  describe("21.1 Mocking & AI Model Isolation", () => {
    it("provides explicit typed fixtures for all canonical try-on job states", () => {
      expect(mockQueuedJob.status).toBe("queued")
      expect(mockQueuedJob.result).toBeNull()

      expect(mockProcessingJob.status).toBe("processing")
      expect(mockProcessingJob.result).toBeNull()

      expect(mockSucceededJob.status).toBe("succeeded")
      expect(mockSucceededJob.result).not.toBeNull()
      expect(mockSucceededJob.result?.image_url).toBeDefined()

      expect(mockFailedJob.status).toBe("failed")
      expect(mockFailedJob.error).not.toBeNull()
      expect(mockFailedJob.error?.code).toBe("TRYON_PROCESSING_FAILED")
    })

    it("verifies component and integration tests never depend on a locally running CatVTON model", () => {
      const scanDir = (dir: string): string[] => {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        const violations: string[] = []
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            violations.push(...scanDir(fullPath))
          } else if (/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) {
            if (entry.name === "testing-strategy.test.ts") {
              continue
            }
            const content = fs.readFileSync(fullPath, "utf-8")
            // Tests must never attempt to invoke local python inference, torch, or raw GPU models
            if (
              content.includes("python -m") ||
              content.includes("spawn('python'") ||
              content.includes("localhost:7860") ||
              content.includes("catvton_worker")
            ) {
              violations.push(fullPath)
            }
          }
        }
        return violations
      }

      const srcViolations = scanDir(SRC_DIR)
      const testsViolations = scanDir(TESTS_DIR)

      expect(srcViolations).toEqual([])
      expect(testsViolations).toEqual([])
    })

    it("provides a canonical mock server for request interception", () => {
      const mockServerPath = path.resolve(SRC_DIR, "test/mock-server.ts")
      expect(fs.existsSync(mockServerPath)).toBe(true)

      const content = fs.readFileSync(mockServerPath, "utf-8")
      expect(content).toContain("class MockServer")
      expect(content).toContain("apiClient.defaults.adapter")
      expect(content).toContain("setJobStatus")
    })
  })

  describe("21.2 Complete 5-Layer Test Strategy Coverage", () => {
    it("verifies Unit layer test suites exist", () => {
      // 1. Formatters
      expect(fs.existsSync(path.resolve(SRC_DIR, "lib/utils/__tests__/format-date.test.ts"))).toBe(true)
      // 2. Validators
      expect(
        fs.existsSync(
          path.resolve(SRC_DIR, "features/uploads/lib/__tests__/validate-person-image.test.ts")
        )
      ).toBe(true)
      // 3. Auth helpers
      expect(fs.existsSync(path.resolve(SRC_DIR, "lib/auth/__tests__/token-store.test.ts"))).toBe(true)
      expect(fs.existsSync(path.resolve(SRC_DIR, "lib/auth/__tests__/safe-redirect.test.ts"))).toBe(true)
      // 4. Query-key builders
      expect(fs.existsSync(path.resolve(SRC_DIR, "test/query-keys.test.ts"))).toBe(true)
      // 5. Polling interval logic
      expect(
        fs.existsSync(
          path.resolve(SRC_DIR, "features/try-on/hooks/__tests__/use-try-on-job.test.ts")
        )
      ).toBe(true)
    })

    it("verifies Component layer test suites exist", () => {
      // 1. Login / register forms
      expect(fs.existsSync(path.resolve(TESTS_DIR, "auth/login.test.tsx"))).toBe(true)
      expect(fs.existsSync(path.resolve(TESTS_DIR, "auth/register.test.tsx"))).toBe(true)
      // 2. Upload dropzone
      expect(
        fs.existsSync(
          path.resolve(SRC_DIR, "features/uploads/components/__tests__/person-upload-dropzone.test.tsx")
        )
      ).toBe(true)
      // 3. Outfit card
      expect(
        fs.existsSync(
          path.resolve(SRC_DIR, "features/outfits/components/__tests__/outfit-card.test.tsx")
        )
      ).toBe(true)
      // 4. Favorite mutation behavior
      expect(
        fs.existsSync(
          path.resolve(SRC_DIR, "features/favorites/components/__tests__/favorite-button.test.tsx")
        )
      ).toBe(true)
      // 5. Job states
      expect(
        fs.existsSync(
          path.resolve(SRC_DIR, "features/try-on/components/__tests__/try-on-processing.test.tsx")
        )
      ).toBe(true)
      expect(
        fs.existsSync(
          path.resolve(SRC_DIR, "features/try-on/components/__tests__/try-on-failure.test.tsx")
        )
      ).toBe(true)
      // 6. Result viewer
      expect(
        fs.existsSync(
          path.resolve(SRC_DIR, "features/try-on/components/__tests__/result-viewer.test.tsx")
        )
      ).toBe(true)
    })

    it("verifies Integration layer test suites exist", () => {
      // 1. Route guards
      expect(fs.existsSync(path.resolve(SRC_DIR, "app/__tests__/guards.test.tsx"))).toBe(true)
      // 2. API error mapping
      expect(fs.existsSync(path.resolve(SRC_DIR, "lib/api/__tests__/errors.test.ts"))).toBe(true)
      expect(fs.existsSync(path.resolve(TESTS_DIR, "architecture/error-handling.test.ts"))).toBe(true)
      // 3. Refresh coordinator
      expect(
        fs.existsSync(path.resolve(SRC_DIR, "lib/api/__tests__/refresh-coordinator.test.ts"))
      ).toBe(true)
      // 4. Optimistic favorite rollback
      expect(
        fs.existsSync(
          path.resolve(SRC_DIR, "features/favorites/hooks/__tests__/use-toggle-favorite.test.tsx")
        )
      ).toBe(true)
    })

    it("verifies E2E user journey test suites exist", () => {
      // 1. Try-on generation journey
      expect(fs.existsSync(path.resolve(TESTS_DIR, "e2e/try-on-journey.test.tsx"))).toBe(true)
      // 2. Favorite lifecycle journey
      expect(fs.existsSync(path.resolve(TESTS_DIR, "e2e/favorite-lifecycle-journey.test.tsx"))).toBe(true)
      // 3. Session lifecycle & logout / expiry journey
      expect(fs.existsSync(path.resolve(TESTS_DIR, "e2e/session-lifecycle-journey.test.tsx"))).toBe(true)
    })

    it("verifies Visual responsive test suite exists", () => {
      expect(fs.existsSync(path.resolve(TESTS_DIR, "visual/responsive-surfaces.test.tsx"))).toBe(true)
    })
  })
})
