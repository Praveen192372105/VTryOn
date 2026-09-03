import type { GridFlowLineProps } from "./grid-flow-line"
import type { GridNodeProps } from "./grid-node"
import type { PatternVariant, PatternPosition } from "./pattern-field"

export type LandingPatternPreset =
  | "hero"
  | "thesis"
  | "how-it-works"
  | "flow"
  | "identity"
  | "outfits"
  | "processing"
  | "result"
  | "privacy"
  | "async"
  | "devices"
  | "comparison"
  | "trust"
  | "final"

export interface CornerPatternConfig {
  variant: PatternVariant
  position: PatternPosition
  className?: string
}

export interface PatternPresetConfig {
  coverage: "full" | "corners" | "bottom-corners" | "sparse-corners"
  motionLevel: "rich" | "moderate" | "minimal" | "static"
  fullGrid?: {
    density?: "default" | "dense" | "sparse"
    flowLines?: GridFlowLineProps[]
    nodes?: GridNodeProps[]
    showCenterMask?: boolean
  }
  corners?: CornerPatternConfig[]
  extraFlowLines?: GridFlowLineProps[]
}

export const PATTERN_PRESETS: Record<LandingPatternPreset, PatternPresetConfig> = {
  // 01. Hero — Rich full system grid with corner framing & 3 flow vectors
  hero: {
    coverage: "full",
    motionLevel: "rich",
    fullGrid: {
      density: "default",
      showCenterMask: true,
      flowLines: [
        { axis: "horizontal", direction: "forward", position: "26%", duration: 8, delay: 0 },
        { axis: "horizontal", direction: "reverse", position: "74%", duration: 10, delay: 2 },
        { axis: "vertical", direction: "reverse", position: "85%", duration: 9, delay: 1 },
      ],
      nodes: [
        { x: "20%", y: "26%", size: 3.5, duration: 4, delay: 0 },
        { x: "85%", y: "26%", size: 4, duration: 5, delay: 1.5 },
        { x: "40%", y: "74%", size: 3, duration: 4.5, delay: 2 },
        { x: "85%", y: "74%", size: 3.5, duration: 6, delay: 0.8 },
      ],
    },
    corners: [
      { variant: "boxed-grid", position: "top-right", className: "mr-4 mt-4 scale-95" },
      { variant: "hexagon", position: "top-right", className: "mr-16 mt-16 scale-90" },
      { variant: "wave", position: "bottom-left", className: "ml-2 mb-2" },
    ],
  },

  // 02. Product Thesis — Calm minimal corner composition
  thesis: {
    coverage: "bottom-corners",
    motionLevel: "minimal",
    corners: [
      { variant: "boxed-grid", position: "bottom-left", className: "-ml-4 -mb-4 opacity-80" },
      { variant: "wave", position: "bottom-right", className: "-mr-4 -mb-4 opacity-80" },
    ],
  },

  // 03. How It Works — Top-left & bottom-right with horizontal directional flow
  "how-it-works": {
    coverage: "corners",
    motionLevel: "moderate",
    corners: [
      { variant: "boxed-grid", position: "top-left", className: "-ml-6 -mt-6 opacity-90" },
      { variant: "tailoring", position: "bottom-right", className: "-mr-6 -mb-6 opacity-90" },
    ],
    extraFlowLines: [
      { axis: "horizontal", direction: "forward", position: "92%", duration: 8.5, delay: 0 },
    ],
  },

  // 04. Try-On Flow — Rich full technical blueprint grid
  flow: {
    coverage: "full",
    motionLevel: "rich",
    fullGrid: {
      density: "dense",
      showCenterMask: true,
      flowLines: [
        { axis: "horizontal", direction: "forward", position: "32%", duration: 7, delay: 0.5 },
        { axis: "horizontal", direction: "reverse", position: "68%", duration: 8.5, delay: 2.2 },
        { axis: "vertical", direction: "forward", position: "15%", duration: 9, delay: 1 },
        { axis: "vertical", direction: "reverse", position: "85%", duration: 8, delay: 3 },
      ],
      nodes: [
        { x: "15%", y: "32%", size: 4, duration: 3.5, delay: 0 },
        { x: "50%", y: "32%", size: 3, duration: 4.2, delay: 1.2 },
        { x: "85%", y: "32%", size: 3.5, duration: 5, delay: 2.4 },
        { x: "15%", y: "68%", size: 3.5, duration: 4.8, delay: 1 },
        { x: "50%", y: "68%", size: 4, duration: 3.8, delay: 2 },
        { x: "85%", y: "68%", size: 4, duration: 4.5, delay: 0.6 },
      ],
    },
    corners: [
      { variant: "tailoring", position: "top-right", className: "-mr-4 -mt-4 opacity-75" },
    ],
  },

  // 05. Identity — Structured geometry vs organic human contour
  identity: {
    coverage: "corners",
    motionLevel: "moderate",
    corners: [
      { variant: "tailoring", position: "top-right", className: "-mr-6 -mt-6" },
      { variant: "contour", position: "bottom-left", className: "-ml-6 -mb-6" },
    ],
    extraFlowLines: [
      { axis: "vertical", direction: "reverse", position: "92%", duration: 9.5, delay: 1 },
    ],
  },

  // 06. Outfit Selection — Asymmetric bottom corners with directional indicators
  outfits: {
    coverage: "bottom-corners",
    motionLevel: "moderate",
    corners: [
      { variant: "boxed-grid", position: "bottom-left", className: "-ml-4 -mb-4 scale-90" },
      { variant: "boxed-grid", position: "bottom-right", className: "-mr-6 -mb-6 scale-105" },
    ],
    extraFlowLines: [
      { axis: "vertical", direction: "reverse", position: "8%", duration: 9, delay: 0 },
      { axis: "horizontal", direction: "reverse", position: "94%", duration: 8, delay: 1.5 },
    ],
  },

  // 07. Truthful AI Processing — Full system grid + hexagonal field
  processing: {
    coverage: "full",
    motionLevel: "rich",
    fullGrid: {
      density: "default",
      showCenterMask: true,
      flowLines: [
        { axis: "horizontal", direction: "forward", position: "28%", duration: 7.5, delay: 0 },
        { axis: "horizontal", direction: "reverse", position: "72%", duration: 9, delay: 2 },
        { axis: "vertical", direction: "forward", position: "76%", duration: 8, delay: 1 },
      ],
      nodes: [
        { x: "25%", y: "28%", size: 3.5, duration: 4, delay: 0 },
        { x: "76%", y: "28%", size: 4, duration: 5, delay: 1.2 },
        { x: "76%", y: "72%", size: 4, duration: 4.5, delay: 2.5 },
        { x: "35%", y: "72%", size: 3, duration: 4.2, delay: 0.8 },
      ],
    },
    corners: [
      { variant: "hexagon", position: "top-right", className: "-mr-8 -mt-8 opacity-80" },
    ],
  },

  // 08. Result Experience — Focus on illustrative comparison
  result: {
    coverage: "corners",
    motionLevel: "minimal",
    corners: [
      { variant: "tailoring", position: "top-left", className: "-ml-6 -mt-6 opacity-85" },
      { variant: "contour", position: "bottom-right", className: "-mr-6 -mb-6 opacity-85" },
    ],
  },

  // 09. Privacy — Contained boundary & very subtle motion
  privacy: {
    coverage: "corners",
    motionLevel: "minimal",
    corners: [
      { variant: "hexagon", position: "top-right", className: "mr-2 -mt-4 opacity-80" },
      { variant: "boxed-grid", position: "bottom-left", className: "-ml-6 -mb-6 opacity-70" },
    ],
    extraFlowLines: [
      { axis: "horizontal", direction: "forward", position: "86%", duration: 12, delay: 2 },
    ],
  },

  // 10. Async UX — Full vertical orchestration map with forward/reverse timeline
  async: {
    coverage: "full",
    motionLevel: "rich",
    fullGrid: {
      density: "sparse",
      showCenterMask: true,
      flowLines: [
        { axis: "vertical", direction: "forward", position: "22%", duration: 8, delay: 0 },
        { axis: "vertical", direction: "reverse", position: "78%", duration: 9.5, delay: 1.8 },
        { axis: "horizontal", direction: "forward", position: "50%", duration: 8.5, delay: 2.5 },
      ],
      nodes: [
        { x: "22%", y: "25%", size: 3.5, duration: 4, delay: 0 },
        { x: "22%", y: "50%", size: 4, duration: 4.5, delay: 1 },
        { x: "22%", y: "75%", size: 3.5, duration: 3.8, delay: 2 },
        { x: "78%", y: "30%", size: 3.5, duration: 4.2, delay: 0.5 },
        { x: "78%", y: "50%", size: 4, duration: 5, delay: 1.5 },
      ],
    },
    corners: [
      { variant: "boxed-grid", position: "bottom-right", className: "-mr-8 -mb-8 opacity-75" },
    ],
  },

  // 11. Devices — Four sparse corners framing hardware illustrations
  devices: {
    coverage: "sparse-corners",
    motionLevel: "minimal",
    corners: [
      { variant: "boxed-grid", position: "top-left", className: "-ml-8 -mt-8 scale-85 opacity-70" },
      { variant: "boxed-grid", position: "top-right", className: "-mr-8 -mt-8 scale-95 opacity-75" },
      { variant: "tailoring", position: "bottom-left", className: "-ml-8 -mb-8 scale-85 opacity-70" },
      { variant: "wave", position: "bottom-right", className: "-mr-8 -mb-8 scale-90 opacity-75" },
    ],
  },

  // 12. Comparison (What It Is / Is Not) — Static calmest section
  comparison: {
    coverage: "bottom-corners",
    motionLevel: "static",
    corners: [
      { variant: "boxed-grid", position: "bottom-left", className: "-ml-6 -mb-6 opacity-60" },
      { variant: "boxed-grid", position: "bottom-right", className: "-mr-6 -mb-6 opacity-60" },
    ],
  },

  // 13. Trust & Limitations — Calm broken architectural geometry
  trust: {
    coverage: "corners",
    motionLevel: "minimal",
    corners: [
      { variant: "boxed-grid", position: "top-right", className: "-mr-6 -mt-6 opacity-75" },
      { variant: "thread", position: "bottom-left", className: "-ml-6 -mb-6 opacity-75" },
    ],
  },

  // 14. Final CTA — Rich full grid with converging flow lines
  final: {
    coverage: "full",
    motionLevel: "rich",
    fullGrid: {
      density: "default",
      showCenterMask: true,
      flowLines: [
        { axis: "horizontal", direction: "forward", position: "32%", duration: 7, delay: 0 },
        { axis: "horizontal", direction: "reverse", position: "68%", duration: 8, delay: 1.5 },
        { axis: "vertical", direction: "forward", position: "50%", duration: 9, delay: 2 },
      ],
      nodes: [
        { x: "20%", y: "32%", size: 3.5, duration: 4, delay: 0 },
        { x: "50%", y: "32%", size: 4, duration: 4.5, delay: 1 },
        { x: "80%", y: "32%", size: 3.5, duration: 3.8, delay: 2 },
        { x: "50%", y: "68%", size: 4, duration: 5, delay: 1.2 },
      ],
    },
    corners: [
      { variant: "hexagon", position: "top-right", className: "-mr-6 -mt-6 opacity-80" },
      { variant: "thread", position: "bottom-left", className: "-ml-6 -mb-6 opacity-80" },
    ],
  },
}
