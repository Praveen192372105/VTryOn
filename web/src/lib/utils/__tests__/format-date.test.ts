import { describe, it, expect } from "vitest"
import { formatDate, formatRelativeTime } from "../format-date"

describe("Formatters: formatDate and formatRelativeTime", () => {
  describe("formatDate", () => {
    it("formats a valid ISO date string correctly", () => {
      const result = formatDate("2026-09-05T12:00:00.000Z")
      expect(result).not.toBe("—")
      expect(result).toContain("2026")
      expect(result).toContain("Sep")
    })

    it("formats timestamps and Date objects", () => {
      const date = new Date("2026-01-15T08:30:00.000Z")
      const resultFromObj = formatDate(date)
      const resultFromNum = formatDate(date.getTime())

      expect(resultFromObj).toContain("2026")
      expect(resultFromObj).toContain("Jan")
      expect(resultFromNum).toBe(resultFromObj)
    })

    it("returns em-dash fallback for null, undefined, or empty string", () => {
      expect(formatDate(null)).toBe("—")
      expect(formatDate(undefined)).toBe("—")
      expect(formatDate("")).toBe("—")
    })

    it("returns em-dash fallback for invalid date strings", () => {
      expect(formatDate("not-a-valid-date")).toBe("—")
      expect(formatDate("NaN")).toBe("—")
    })
  })

  describe("formatRelativeTime", () => {
    it("returns 'just now' for durations under 60 seconds", () => {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000)
      expect(formatRelativeTime(thirtySecondsAgo)).toBe("just now")
    })

    it("returns 'Xm ago' for durations under 60 minutes", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m ago")
    })

    it("returns 'Xh ago' for durations under 24 hours", () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000)
      expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago")
    })

    it("returns 'Xd ago' for durations under 30 days", () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 86400 * 1000)
      expect(formatRelativeTime(fourDaysAgo)).toBe("4d ago")
    })

    it("falls back to standard formatted date for durations beyond 30 days", () => {
      const fortyDaysAgo = new Date(Date.now() - 40 * 86400 * 1000)
      const relative = formatRelativeTime(fortyDaysAgo)
      expect(relative).not.toContain("ago")
      expect(relative).not.toBe("just now")
      expect(relative).not.toBe("—")
    })

    it("returns em-dash fallback for null, undefined, and invalid inputs", () => {
      expect(formatRelativeTime(null)).toBe("—")
      expect(formatRelativeTime(undefined)).toBe("—")
      expect(formatRelativeTime("invalid-timestamp")).toBe("—")
    })
  })
})
