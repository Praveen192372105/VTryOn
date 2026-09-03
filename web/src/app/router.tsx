import React, { Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { ROUTES } from "./route-paths"
import { PublicLayout } from "../layouts/public-layout"
import { AuthLayout } from "../layouts/auth-layout"
import { AppLayout } from "../layouts/app-layout"
import { RequireAuth, RequireGuest } from "./guards"
import { LoadingShell } from "../components/feedback/loading-shell"

// Lazy-loaded routes for performance
const LandingPage = React.lazy(() => import("../pages/public/landing-page"))
const LoginPage = React.lazy(() => import("../pages/auth/login-page"))
const RegisterPage = React.lazy(() => import("../pages/auth/register-page"))
const StudioPage = React.lazy(() => import("../pages/app/studio-page"))
const OutfitsPage = React.lazy(() => import("../pages/app/outfits-page"))
const FavoritesPage = React.lazy(() => import("../pages/app/favorites-page"))
const UploadsPage = React.lazy(() => import("../pages/app/uploads-page"))
const HistoryPage = React.lazy(() => import("../pages/app/history-page"))
const TryOnDetailPage = React.lazy(() => import("../pages/app/try-on-detail-page"))
const SettingsPage = React.lazy(() => import("../pages/app/settings-page"))
const NotFoundPage = React.lazy(() => import("../pages/errors/not-found-page"))

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingShell />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  // Public Marketing Routes
  {
    path: ROUTES.home,
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <LandingPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },

  // Auth Routes (Guest Only)
  {
    element: <RequireGuest />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: ROUTES.login,
            element: (
              <SuspenseWrapper>
                <LoginPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTES.register,
            element: (
              <SuspenseWrapper>
                <RegisterPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
    ],
  },

  // Protected App Routes
  {
    path: ROUTES.app,
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={ROUTES.studio} replace />,
          },
          {
            path: "studio",
            element: (
              <SuspenseWrapper>
                <StudioPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "outfits",
            element: (
              <SuspenseWrapper>
                <OutfitsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "favorites",
            element: (
              <SuspenseWrapper>
                <FavoritesPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "uploads",
            element: (
              <SuspenseWrapper>
                <UploadsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "history",
            element: (
              <SuspenseWrapper>
                <HistoryPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "try-ons/:id",
            element: (
              <SuspenseWrapper>
                <TryOnDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "settings",
            element: (
              <SuspenseWrapper>
                <SettingsPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
    ],
  },

  // Catch-All 404
  {
    path: "*",
    element: (
      <SuspenseWrapper>
        <NotFoundPage />
      </SuspenseWrapper>
    ),
  },
])
