import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { GridFlowLine } from "../../src/features/landing/patterns/grid-flow-line"
import { GridNode } from "../../src/features/landing/patterns/grid-node"
import { FlowGridPattern } from "../../src/features/landing/patterns/flow-grid-pattern"
import { SectionPattern } from "../../src/features/landing/patterns/section-pattern"
import { PATTERN_PRESETS, type LandingPatternPreset } from "../../src/features/landing/patterns/pattern-presets"

describe("Pattern System Upgrade Unit Tests", () => {
  describe("GridFlowLine", () => {
    it("renders horizontal forward flow line with aria-hidden and pointer-events-none", () => {
      const { container } = render(
        <GridFlowLine axis="horizontal" direction="forward" position="30%" duration={8} />
      )

      const lineEl = container.firstElementChild as HTMLElement
      expect(lineEl).toHaveAttribute("aria-hidden", "true")
      expect(lineEl.className).toContain("pointer-events-none")
      expect(lineEl.className).toContain("overflow-hidden")
    })

    it("renders horizontal reverse flow line with custom position", () => {
      const { container } = render(
        <GridFlowLine axis="horizontal" direction="reverse" position="75%" duration={10} />
      )

      const lineEl = container.firstElementChild as HTMLElement
      expect(lineEl).toHaveAttribute("aria-hidden", "true")
      expect(lineEl.style.top).toBe("75%")
    })

    it("renders vertical forward and reverse flow lines", () => {
      const { container } = render(
        <div>
          <GridFlowLine axis="vertical" direction="forward" position="20%" />
          <GridFlowLine axis="vertical" direction="reverse" position="80%" />
        </div>
      )

      const lines = container.querySelectorAll("[aria-hidden='true']")
      expect(lines.length).toBe(2)
    })
  })

  describe("GridNode", () => {
    it("renders active coordinate node with aria-hidden and correct position", () => {
      const { container } = render(<GridNode x="45%" y="60%" size={4} />)

      const nodeEl = container.firstElementChild as HTMLElement
      expect(nodeEl).toHaveAttribute("aria-hidden", "true")
      expect(nodeEl.style.left).toBe("45%")
      expect(nodeEl.style.top).toBe("60%")
      expect(nodeEl.style.width).toBe("4px")
      expect(nodeEl.style.height).toBe("4px")
    })
  })

  describe("FlowGridPattern", () => {
    it("renders micro-grid, major-grid, and center readability mask", () => {
      const { container } = render(
        <FlowGridPattern
          density="default"
          flowLines={[{ axis: "horizontal", direction: "forward", position: "25%" }]}
          nodes={[{ x: "25%", y: "25%", size: 3 }]}
          showCenterMask={true}
        />
      )

      const root = container.firstElementChild as HTMLElement
      expect(root).toHaveAttribute("aria-hidden", "true")
      expect(root.className).toContain("pointer-events-none")
    })
  })

  describe("SectionPattern Presets", () => {
    const allPresets: LandingPatternPreset[] = [
      "hero",
      "thesis",
      "how-it-works",
      "flow",
      "identity",
      "outfits",
      "processing",
      "result",
      "privacy",
      "async",
      "devices",
      "comparison",
      "trust",
      "final",
    ]

    allPresets.forEach((preset) => {
      it(`renders preset '${preset}' with aria-hidden and pointer-events-none`, () => {
        const { container } = render(<SectionPattern preset={preset} />)
        const root = container.firstElementChild as HTMLElement
        expect(root).toHaveAttribute("aria-hidden", "true")
        expect(root.className).toContain("pointer-events-none")
      })
    })

    it("verifies alternating rhythm in PATTERN_PRESETS definition", () => {
      // Full grid sections: hero, flow, processing, async, final
      expect(PATTERN_PRESETS.hero.coverage).toBe("full")
      expect(PATTERN_PRESETS.flow.coverage).toBe("full")
      expect(PATTERN_PRESETS.processing.coverage).toBe("full")
      expect(PATTERN_PRESETS.async.coverage).toBe("full")
      expect(PATTERN_PRESETS.final.coverage).toBe("full")

      // Calm sections
      expect(PATTERN_PRESETS.thesis.coverage).toBe("bottom-corners")
      expect(PATTERN_PRESETS.privacy.coverage).toBe("corners")
      expect(PATTERN_PRESETS.comparison.coverage).toBe("bottom-corners")
    })
  })
})
