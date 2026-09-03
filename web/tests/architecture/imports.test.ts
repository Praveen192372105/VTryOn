import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

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

describe("Architecture Invariant Tests", () => {
  const allFiles = getAllSourceFiles(SRC_DIR)

  it("prohibits UI components from importing axios directly", () => {
    const uiFiles = allFiles.filter((file) => {
      const relative = path.relative(SRC_DIR, file).replace(/\\/g, "/")
      return (
        (relative.startsWith("components/") || relative.startsWith("pages/")) &&
        !relative.includes("__tests__")
      )
    })

    const violations: string[] = []
    for (const file of uiFiles) {
      const content = fs.readFileSync(file, "utf-8")
      if (content.match(/from\s+["']axios["']/)) {
        violations.push(path.relative(SRC_DIR, file))
      }
    }

    expect(violations).toEqual([])
  })

  it("prohibits lib/ from importing features/ or pages/", () => {
    const libFiles = allFiles.filter((file) => {
      const relative = path.relative(SRC_DIR, file).replace(/\\/g, "/")
      return relative.startsWith("lib/") && !relative.includes("__tests__")
    })

    const violations: string[] = []
    for (const file of libFiles) {
      const content = fs.readFileSync(file, "utf-8")
      if (content.includes("features/") || content.includes("pages/")) {
        violations.push(path.relative(SRC_DIR, file))
      }
    }

    expect(violations).toEqual([])
  })

  it("prohibits features/ from importing pages/", () => {
    const featureFiles = allFiles.filter((file) => {
      const relative = path.relative(SRC_DIR, file).replace(/\\/g, "/")
      return relative.startsWith("features/") && !relative.includes("__tests__")
    })

    const violations: string[] = []
    for (const file of featureFiles) {
      const content = fs.readFileSync(file, "utf-8")
      if (content.includes("pages/")) {
        violations.push(path.relative(SRC_DIR, file))
      }
    }

    expect(violations).toEqual([])
  })

  it("prohibits src/ from importing tests/", () => {
    const violations: string[] = []
    for (const file of allFiles) {
      const relative = path.relative(SRC_DIR, file).replace(/\\/g, "/")
      if (relative.includes("__tests__")) continue

      const content = fs.readFileSync(file, "utf-8")
      if (content.includes("@/tests") || content.includes("../tests") || content.includes("../../tests")) {
        violations.push(relative)
      }
    }

    expect(violations).toEqual([])
  })

  it("prohibits unauthorized icon libraries (Lucide, MUI, React-Icons, Heroicons)", () => {
    const bannedLibraries = [
      "lucide-react",
      "@mui/icons-material",
      "react-icons",
      "@heroicons/react",
    ]

    const violations: { file: string; library: string }[] = []
    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf-8")
      for (const lib of bannedLibraries) {
        if (content.includes(`"${lib}"`) || content.includes(`'${lib}'`)) {
          violations.push({ file: path.relative(SRC_DIR, file), library: lib })
        }
      }
    }

    expect(violations).toEqual([])
  })

  it("prohibits scattered auth token access outside lib/auth/token-store.ts", () => {
    const tokenStorePath = path.resolve(SRC_DIR, "lib/auth/token-store.ts")
    const violations: string[] = []

    for (const file of allFiles) {
      if (file === tokenStorePath || file.includes("__tests__")) continue

      const content = fs.readFileSync(file, "utf-8")
      if (
        content.includes("localStorage.getItem(\"vtryon_") ||
        content.includes("localStorage.setItem(\"vtryon_") ||
        content.includes("sessionStorage.getItem(\"vtryon_")
      ) {
        violations.push(path.relative(SRC_DIR, file))
      }
    }

    expect(violations).toEqual([])
  })

  it("prohibits fake production data tokens in production features and pages", () => {
    const bannedTokens = ["mockOutfits", "sampleJobs", "fakeFavorites", "demoUploads"]
    const violations: { file: string; token: string }[] = []

    for (const file of allFiles) {
      if (file.includes("__tests__")) continue

      const content = fs.readFileSync(file, "utf-8")
      for (const token of bannedTokens) {
        if (content.includes(token)) {
          violations.push({ file: path.relative(SRC_DIR, file), token })
        }
      }
    }

    expect(violations).toEqual([])
  })
})
