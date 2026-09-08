import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import SettingsPage from "../settings-page"
import { renderWithProviders } from "../../../test/render"
import * as authHook from "../../../features/auth/use-auth"

describe("SettingsPage", () => {
  const mockLogout = vi.fn()
  const mockUser = {
    id: "usr_1234567890",
    name: "Eswar Chinthakayala",
    email: "eswarchinthakayala2004@gmail.com",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: mockUser,
      status: "authenticated",
      authReason: null,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      clearAuthReason: vi.fn(),
    })
  })

  it("renders centered page header with title and description", () => {
    const { container } = renderWithProviders(<SettingsPage />, { initialEntries: ["/app/settings"] })

    // Check centered container max-width class
    const centeredWrapper = container.querySelector(".max-w-3xl.mx-auto")
    expect(centeredWrapper).toBeInTheDocument()

    expect(screen.getByRole("heading", { name: /Account & Settings/i })).toBeInTheDocument()
    expect(
      screen.getByText(/Manage your account profile, theme preferences, and active session/i)
    ).toBeInTheDocument()
  })

  it("renders user profile identity, initials, and email", () => {
    renderWithProviders(<SettingsPage />, { initialEntries: ["/app/settings"] })

    expect(screen.getByText("Eswar Chinthakayala")).toBeInTheDocument()
    expect(screen.getByText("eswarchinthakayala2004@gmail.com")).toBeInTheDocument()
    expect(screen.getByText("EC")).toBeInTheDocument()
    expect(screen.getByText("Active Account")).toBeInTheDocument()
    expect(screen.getByText("Isolated & Private")).toBeInTheDocument()
  })

  it("renders 3 theme options and allows selecting different themes", () => {
    renderWithProviders(<SettingsPage />, { initialEntries: ["/app/settings"] })

    expect(screen.getByRole("radio", { name: /Dark/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /Light/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /System/i })).toBeInTheDocument()

    const lightOption = screen.getByRole("radio", { name: /Light/i })
    fireEvent.click(lightOption)
    expect(lightOption).toHaveAttribute("aria-checked", "true")
  })

  it("calls logout when Sign Out button is clicked", () => {
    renderWithProviders(<SettingsPage />, { initialEntries: ["/app/settings"] })

    const signOutBtn = screen.getByRole("button", { name: /Sign Out/i })
    expect(signOutBtn).toBeInTheDocument()

    fireEvent.click(signOutBtn)
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })
})
