import React from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { ROUTES } from "./route-paths"
import { PublicLayout, AuthLayout } from "../components/layout"
import { RequireAuth, RequireGuest } from "./guards"
import { ConnectedAppLayout } from "./connected-app-layout"
import { SuspenseWrapper } from "./suspense-wrapper"
import { RouteErrorBoundary } from "../components/feedback"

// Lazy-loaded routes for performance & code-splitting
const LandingPage = React.lazy(() => import("../pages/public/landing-page"))
const HowItWorksPage = React.lazy(() => import("../pages/public/how-it-works-page"))
const PrivacyPage = React.lazy(() => import("../pages/public/privacy-page"))
const TermsPage = React.lazy(() => import("../pages/public/terms-page"))

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
const ProtectedNotFoundPage = React.lazy(() => import("../pages/errors/protected-not-found-page"))

export const router = createBrowserRouter([
  // Public Marketing & Legal Routes
  {
    path: ROUTES.home,
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <LandingPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "how-it-works",
        element: (
          <SuspenseWrapper>
            <HowItWorksPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "privacy",
        element: (
          <SuspenseWrapper>
            <PrivacyPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "terms",
        element: (
          <SuspenseWrapper>
            <TermsPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },

  // Auth Routes (Guest Only)
  {
    element: <RequireGuest />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: ROUTES.auth.login,
            element: (
              <SuspenseWrapper>
                <LoginPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTES.auth.register,
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
    path: ROUTES.app.root,
    element: <RequireAuth />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <ConnectedAppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={ROUTES.app.studio} replace />,
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
            path: "try-ons/:jobId",
            element: (
              <SuspenseWrapper>
                <TryOnDetailPage />
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
          // Protected 404 inside AppShell
          {
            path: "*",
            element: (
              <SuspenseWrapper>
                <ProtectedNotFoundPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
    ],
  },

  // Catch-All Global 404
  {
    path: "*",
    element: (
      <SuspenseWrapper>
        <NotFoundPage />
      </SuspenseWrapper>
    ),
  },
], {
  basename: import.meta.env.BASE_URL,
})
