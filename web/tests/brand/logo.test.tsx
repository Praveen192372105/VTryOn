import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import fs from "node:fs"
import path from "node:path"
import { LogoMark, LOGO_PATHS } from "../../src/components/brand/LogoMark"
import { Logo, BrandMark } from "../../src/components/brand/Logo"
import { AppIcon } from "../../src/components/brand/AppIcon"
import { BrandLockup } from "../../src/components/brand/BrandLockup"

describe("Brand Identity System — Logo, LogoMark, AppIcon & Assets", () => {
  describe("LogoMark Component", () => {
    it("renders valid SVG with 0 0 64 64 viewBox and currentColor fill", () => {
      const { container } = render(<LogoMark size={32} />)
      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute("viewBox", "0 0 64 64")
      expect(svg).toHaveAttribute("fill", "currentColor")
      expect(svg).toHaveAttribute("width", "32")
      expect(svg).toHaveAttribute("height", "32")
    })

    it("renders exactly 5 mathematical fold facets with fill='currentColor'", () => {
      const { container } = render(<LogoMark />)
      const paths = container.querySelectorAll("path")
      expect(paths.length).toBe(5)
      expect(LOGO_PATHS.length).toBe(5)

      paths.forEach((p) => {
        expect(p).toHaveAttribute("fill", "currentColor")
        expect(p.getAttribute("d")).toBeTruthy()
      })
    })

    it("supports accessibility for non-decorative role='img' and accessible label", () => {
      const { container } = render(<LogoMark title="V Try-On Official Brand Mark" decorative={false} />)
      const svg = container.querySelector("svg")
      expect(svg).toHaveAttribute("role", "img")
      expect(svg).toHaveAttribute("aria-label", "V Try-On Official Brand Mark")
      const titleEl = container.querySelector("title")
      expect(titleEl).toHaveTextContent("V Try-On Official Brand Mark")
    })

    it("supports decorative mode with aria-hidden and focusable false", () => {
      const { container } = render(<LogoMark decorative={true} />)
      const svg = container.querySelector("svg")
      expect(svg).toHaveAttribute("aria-hidden", "true")
      expect(svg).toHaveAttribute("focusable", "false")
      expect(container.querySelector("title")).toBeNull()
    })

    it("supports size variants across 16px, 20px, 24px, 32px, 48px, 64px, 128px, 512px", () => {
      const sizes = [16, 20, 24, 32, 48, 64, 128, 512]
      sizes.forEach((s) => {
        const { container } = render(<LogoMark size={s} />)
        const svg = container.querySelector("svg")
        expect(svg).toHaveAttribute("width", s.toString())
        expect(svg).toHaveAttribute("height", s.toString())
      })
    })

    it("contains no raster images, scripts, or external URLs", () => {
      const { container } = render(<LogoMark />)
      expect(container.querySelector("image")).toBeNull()
      expect(container.querySelector("script")).toBeNull()
      expect(container.querySelector("foreignObject")).toBeNull()
    })
  })

  describe("AppIcon Component", () => {
    it("renders rounded container with centered LogoMark", () => {
      const { container } = render(<AppIcon size={64} title="V Try-On App Icon" />)
      const root = container.firstElementChild as HTMLElement
      expect(root).toHaveAttribute("role", "img")
      expect(root).toHaveAttribute("aria-label", "V Try-On App Icon")
      expect(root.style.width).toBe("64px")
      expect(root.style.height).toBe("64px")

      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute("viewBox", "0 0 64 64")
    })

    it("supports decorative mode", () => {
      const { container } = render(<AppIcon size={48} decorative={true} />)
      const root = container.firstElementChild as HTMLElement
      expect(root).toHaveAttribute("aria-hidden", "true")
    })
  })

  describe("BrandLockup Component", () => {
    it("renders horizontal lockup with brand name and tagline", () => {
      const { container } = render(
        <BrandLockup layout="horizontal" showTagline={true} tagline="AI Fitting Room" />
      )
      expect(container.textContent).toContain("V Try-On")
      expect(container.textContent).toContain("AI Fitting Room")
      expect(container.querySelector("svg")).toBeInTheDocument()
    })

    it("renders vertical lockup", () => {
      const { container } = render(
        <BrandLockup layout="vertical" showTagline={true} tagline="Haute Couture Diffusion" />
      )
      expect(container.textContent).toContain("V Try-On")
      expect(container.textContent).toContain("Haute Couture Diffusion")
    })
  })

  describe("Logo Component", () => {
    it("renders brand mark and wordmark with link to home", () => {
      const { container } = render(
        <MemoryRouter>
          <Logo linkToHome={true} showWordmark={true} />
        </MemoryRouter>
      )
      const link = container.querySelector("a")
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute("href", "/")
      expect(container.textContent).toContain("V Try-On")
      expect(container.querySelector("svg")).toBeInTheDocument()
    })

    it("renders without link when linkToHome={false}", () => {
      const { container } = render(<Logo linkToHome={false} />)
      expect(container.querySelector("a")).toBeNull()
      expect(container.textContent).toContain("V Try-On")
    })

    it("renders tagline when showTagline={true}", () => {
      const { container } = render(
        <MemoryRouter>
          <Logo showTagline={true} />
        </MemoryRouter>
      )
      expect(container.textContent).toContain("Studio")
    })

    it("renders BrandMark standalone helper", () => {
      const { container } = render(<BrandMark size={20} />)
      expect(container.querySelector("svg")).toBeInTheDocument()
    })
  })

  describe("Standalone Assets Inspection", () => {
    it("public/favicon.svg contains valid SVG geometry and no raster textures", () => {
      const faviconPath = path.resolve(__dirname, "../../public/favicon.svg")
      const content = fs.readFileSync(faviconPath, "utf-8")
      expect(content).toContain("<svg")
      expect(content).toContain("viewBox=\"0 0 64 64\"")
      expect(content).toContain("<path")
      expect(content).not.toContain("<image")
      expect(content).not.toContain("<filter") // Clean pure vector, no heavy raster filters
      expect(content).not.toContain("script")
    })

    it("public/icon.svg contains 512x512 app icon definition", () => {
      const iconPath = path.resolve(__dirname, "../../public/icon.svg")
      const content = fs.readFileSync(iconPath, "utf-8")
      expect(content).toContain("<svg")
      expect(content).toContain("viewBox=\"0 0 512 512\"")
      expect(content).toContain("rx=\"124\"")
      expect(content).not.toContain("<image")
      expect(content).not.toContain("script")
    })
  })
})
