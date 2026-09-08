# V Try-On — Web Application

High-fashion AI virtual fitting room web client for **V Try-On**, powered by FastAPI, Celery, Redis, and CatVTON.

---

## 1. Overview & Vision

V Try-On is an image-first, editorial fashion application where users upload silhouette portraits and preview realistic garment drape, contour matching, and texture synthesis.

### Visual Identity
- **Monochrome Palette**: Deep blacks, zinc grays, clean whites (`oklch` design tokens).
- **Typography**: Inter Variable with disciplined typographic roles.
- **Image-First**: Standardized 3:4 portrait ratios, progressive skeleton reveals, zero collage/sticker effects.
- **Iconography**: Exclusively `@hugeicons/react` and `@hugeicons/core-free-icons`.

---

## 2. Technology Stack

- **Framework**: [Vite 8](https://vitejs.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + custom monochrome design system
- **Accessible Primitives**: [shadcn/ui](https://ui.shadcn.com/) / Base UI primitives
- **Iconography**: [Hugeicons React](https://hugeicons.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **State Management**: [TanStack Query v5](https://tanstack.com/query)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/) with concurrent refresh coordinator and request ID generation
- **Testing**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)

---

## 3. Directory Structure

```text
src/
├── app/                  # Application composition only (App, router, providers, query-client, route-paths, guards)
├── assets/               # Bundled static assets only (brand artwork, placeholders)
├── components/           # Truly shared UI, brand, feedback, image, layout, and navigation primitives
│   ├── brand/            # Brand Logo, LogoMark, BrandLockup, AppIcon
│   ├── feedback/         # Domain-neutral states: EmptyState, ErrorPanel, LoadingShell
│   ├── image/            # Generic image components: ImageFrame
│   ├── layout/           # Shared layout primitives: AppLayout, AuthLayout, PublicLayout, Container, PageShell
│   ├── navigation/       # Domain-neutral navigation: AppNavbar, MobileTabBar
│   └── ui/               # Base UI / shadcn design primitives
├── config/               # Static configuration (env validation, app-config, navigation schemas)
├── features/             # Self-contained business feature modules
│   ├── account/          # Account profile & settings presentation
│   ├── auth/             # Decomposed auth API (login, register, logout, me, refresh), schemas, useAuth
│   ├── favorites/        # Wardrobe favorites API (list, add, remove), hooks, query keys
│   ├── history/          # Try-on history grid & presentation (reuses try-on transport)
│   ├── landing/          # 14-section marketing landing experience, patterns, and motion controllers
│   ├── outfits/          # Garment catalogue API (list, get), hooks, query keys, category browsing
│   ├── try-on/           # Core fitting domain: composer, status, result viewer, polling hook, mutation
│   └── uploads/          # Portrait manager API (create, list, get, delete), hooks, mutation, query keys
├── hooks/                # Truly cross-feature React hooks (useMediaQuery, useReducedMotion, useDocumentTitle)
├── lib/                  # Framework-agnostic infrastructure
│   ├── api/              # Central typed Axios client, errors, refresh coordinator, request-id
│   ├── auth/             # Token store abstraction (in-memory + localStorage cache)
│   └── utils/            # Modular utilities: cn, format-date, scroll-to-section
├── pages/                # Route-level composition only (public, auth, app, errors)
│   ├── app/              # Studio, outfits, favorites, uploads, history, try-on-detail, settings
│   ├── auth/             # Login, register
│   ├── errors/           # 404 Not Found
│   └── public/           # Marketing landing page
├── styles/               # Centralized styling
│   ├── globals.css       # Tailwind base, tw-animate, font imports
│   ├── motion.css        # Reduced-motion design rules
│   └── tokens.css        # Monochrome OKLCH design tokens
├── types/                # Universal shared types (PaginationMeta, PaginatedResponse)
└── main.tsx              # Root DOM bootstrap
tests/
├── architecture/         # Automated architecture invariant tests (10 rules)
├── auth/                 # Auth flow, layout, and validation tests
├── brand/                # Brand identity & SVG tests
└── landing/              # Landing page, section sequence, and pattern system tests
```

---

## 4. Core Architecture Invariants

### 4.1 Dependency Direction
Code flows strictly downward:
```text
Application Composition (src/app/)
        ↓
Pages (src/pages/)
        ↓
Features (src/features/)
        ↓
Shared Components & Hooks (src/components/, src/hooks/)
        ↓
Infrastructure Libraries & Config (src/lib/, src/config/)
        ↓
FastAPI Backend (/api/v1)
```
- `components/` **must not** import `features/` or `pages/`.
- `lib/` **must not** import `features/` or `pages/`.
- `features/` **must not** import `pages/`.
- `src/` **must not** import `tests/`.

### 4.2 Network & Transport Boundary
**UI components must never import Axios or call `fetch()` directly.**
All remote calls follow the path:
```text
Page / UI Component
        ↓
Feature Hook (e.g. useTryOnJob, useUploads)
        ↓
Feature API Module (e.g. api/get-try-on.ts)
        ↓
Central Typed API Client (lib/api/client.ts)
        ↓
FastAPI Backend (/api/v1)
```

### 4.3 Feature Module Ownership
Each feature owns its domain API functions, React Query hooks, domain components, validation schemas, query keys, and types. External consumers import only through the feature's public `index.ts` barrel.

### 4.4 State Ownership
- **TanStack Query** owns all remote server state (`user`, `uploads`, `outfits`, `favorites`, `jobs`). Server state is **never** mirrored into redundant global stores.
- **React Local State** (`useState`, `useReducer`) owns ephemeral UI state (modal open/close, active filter tab, selected IDs).

### 4.5 Token Storage Rule
All access to authentication tokens routes strictly through `src/lib/auth/token-store.ts`. Scattered `localStorage.getItem` or `sessionStorage` calls are strictly prohibited.

### 4.6 Iconography Rule
**Hugeicons React is the sole application icon library.** The codebase enforces zero imports of `lucide-react`, `@mui/icons-material`, `react-icons`, or `@heroicons/react`.

### 4.7 Truthful Async States
Try-on jobs map directly to backend statuses:
- `queued` → *"Waiting to start"*
- `processing` → *"Creating your look"*
- `succeeded` → *"Your look is ready"*
- `failed` → *"We couldn't create this look"*

**Fabricated percentage progress bars (e.g. 25%, 70%) are strictly prohibited.** Polling automatically halts upon reaching terminal statuses (`succeeded` or `failed`).

### 4.8 Zero Fake Production Data
Production features and pages contain no mock data arrays (`mockOutfits`, `sampleJobs`, etc.). If the catalogue or history is empty, a truthful `EmptyState` component is displayed.

---

## 5. Route Map
 
| Path | Access | Component / Description |
|------|--------|--------------------------|
| `/` | Public | Marketing Landing Page (14 sections, custom SVG logo, smooth anchor nav) |
| `/login` | Guest Only | Centered authentication form |
| `/register` | Guest Only | Centered account creation form |
| `/app` | Authenticated | Redirects to `/app/studio` |
| `/app/studio` | Authenticated | Core Try-On Studio (person portrait selector, garment selector, synthesis) |
| `/app/outfits` | Authenticated | Garment catalogue browser with category filtering |
| `/app/favorites` | Authenticated | Favorited outfits wardrobe |
| `/app/uploads` | Authenticated | User portraits & silhouette manager |
| `/app/history` | Authenticated | Try-on history timeline |
| `/app/try-ons/:id` | Authenticated | Dynamic job detail view with auto-polling & terminal state handling |
| `/app/settings` | Authenticated | Account profile & session controls |
| `*` | Public | Editorial 404 Not Found screen |

---

## 6. Environment Variables

Create `.env` based on `.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

> **Security Note**: Only variables prefixed with `VITE_` are exposed to the browser. Never place JWT secrets, database passwords, or storage credentials in web environment files.

---

## 6. Development & Scripts

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run unit, component & architecture tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Build production bundle
npm run build

# Preview production bundle locally
npm run preview
```

---

## 7. Design System & Premium UI Language

The V Try-On design system embodies a restrained visual language:
```text
fashion editorial + minimal AI product + monochrome precision + strong imagery + quiet motion
```

### 7.1 Theme Architecture
- **Dual Themes**: Full semantic parity between **Dark Mode** (near-black, lifted zinc surfaces) and **Light Mode** (white, subtle zinc hierarchy).
- **Theme Provider**: Managed via `ThemeProvider` and `useTheme()` with `"dark" | "light" | "system"` options, persisted to `vtryon-theme` in `localStorage`.
- **Token Rule**: Components consume semantic CSS variables (`bg-background`, `bg-surface`, `text-foreground`, `border-border`, etc.) instead of hardcoded hex/zinc values.

### 7.2 Semantic Token Hierarchy

| Token Group | Semantic CSS Variable | Purpose |
|-------------|-----------------------|---------|
| **Surfaces** | `--background`, `--surface`, `--surface-raised`, `--surface-subtle` | Strict 3-tier elevation hierarchy |
| **Typography** | `--foreground`, `--muted-foreground` | High-contrast editorial & readable metadata |
| **Borders** | `--border`, `--border-strong` | Controlled 1px boundaries |
| **Primary CTA** | `--primary`, `--primary-foreground`, `--accent`, `--accent-foreground` | Dominant monochrome actions |
| **Status Semantics** | `--success`, `--danger`, `--warning` | Restrained semantic feedback |
| **Focus** | `--ring`, `--focus-ring` | High-contrast keyboard accessibility |
| **Radii** | `--radius-xs` (6px) to `--radius-2xl` (24px) | Consistent optical scale |
| **Scrollbars** | `--scrollbar-track`, `--scrollbar-thumb` | Dark & light native scrollbar integration |

### 7.3 Shared UI Primitives

| Component | Export Location | Responsibility |
|-----------|-----------------|----------------|
| **Button / AppButton** | `src/components/ui/button.tsx` | Canonical action button with variants (`default`, `secondary`, `outline`, `ghost`, `destructive`, `link`), sizes (`sm`, `default`, `lg`, `icon`), loading spinner, and icon slots. |
| **ImageFrame** | `src/components/image/image-frame.tsx` | Media container with standard fashion aspect ratios (`3/4`, `4/5`, `1/1`), `cover`/`contain` fit modes, shimmer skeleton, fallback, and selection state. |
| **ImageCompare** | `src/components/image/image-compare.tsx` | Before / After split slider for original portrait vs. try-on result with GPU clipping, pointer drag, and keyboard navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`). |
| **PageHeader** | `src/components/layout/page-header.tsx` | Operational workspace header supporting `title`, `description`, back link, breadcrumb, and responsive action layout. |
| **SectionShell** | `src/components/layout/section-shell.tsx` | Responsive layout container with `size="app"` (max-w-7xl) or `size="marketing"` with responsive padding. |
| **StatusBadge** | `src/components/feedback/status-badge.tsx` | Canonical try-on status representation (`queued`, `processing`, `succeeded`, `failed`) with restrained semantic colors and zero fake states. |
| **EmptyState** | `src/components/feedback/empty-state.tsx` | Truthful, unbloated empty state with supportive Hugeicons icon, title, description, and primary CTA. |
| **ErrorState** | `src/components/feedback/error-state.tsx` | Recoverable error view with safe user-facing message, optional retry callback, and optional request ID reference. |
| **ConfirmDialog** | `src/components/feedback/confirm-dialog.tsx` | Accessible destructive confirmation modal protecting irreversible actions (e.g. portrait photo deletion). |

### 7.4 Iconography & Motion Rules
- **Hugeicons is the canonical UI icon library.** Custom SVG is strictly reserved for brand marks and bespoke landing storytelling patterns.
- **Purposeful & Reduced Motion**: All animations, skeletons, and pulses respect `prefers-reduced-motion: reduce`.

---

## 8. Routing & Navigation Architecture

The frontend routing follows a deterministic, nested layout hierarchy with centralized route constants, explicit access policies, safe redirect validation, and transparent session recovery.

### 8.1 Canonical Route Table

| Route | Access Policy | Guard / Layout | Component / Screen |
|-------|---------------|----------------|--------------------|
| `/` | Public | `PublicLayout` | Marketing Landing Page |
| `/how-it-works` | Public | `PublicLayout` | Focused Product Education |
| `/privacy` | Public | `PublicLayout` | Privacy Policy |
| `/terms` | Public | `PublicLayout` | Terms of Service |
| `/login` | Guest Only | `RequireGuest` + `AuthLayout` | Sign In Form |
| `/register` | Guest Only | `RequireGuest` + `AuthLayout` | Registration Form |
| `/app` | Protected | `RequireAuth` + `AppLayout` | Declarative Redirect to `/app/studio` |
| `/app/studio` | Protected | `RequireAuth` + `AppLayout` | Fitting Studio |
| `/app/uploads` | Protected | `RequireAuth` + `AppLayout` | Portrait Photo Library |
| `/app/outfits` | Protected | `RequireAuth` + `AppLayout` | Garment Catalogue Browser |
| `/app/favorites` | Protected | `RequireAuth` + `AppLayout` | Saved Outfits Wardrobe |
| `/app/history` | Protected | `RequireAuth` + `AppLayout` | Try-On Generation History |
| `/app/try-ons/:id` | Protected | `RequireAuth` + `AppLayout` | Try-On Result & Interactive Compare |
| `/app/settings` | Protected | `RequireAuth` + `AppLayout` | Account & Appearance Settings |
| `/app/*` | Protected | `RequireAuth` + `AppLayout` | Protected 404 (Workspace Error) |
| `*` | Public / Any | Global | Global 404 (Page Not Found) |

### 8.2 Route Tree Architecture

```text
                     ROUTER
                       │
          ┌────────────┼─────────────┐
          │            │             │
          ▼            ▼             ▼
     PublicLayout  GuestOnly     RequireAuth
          │            │             │
      Marketing     Auth UI        AppShell
     ┌────┼────┐      ┌──┴──┐        ├── /app (redirect to /app/studio)
     │    │    │      │     │        ├── /app/studio
     /  how-  priv- login register   ├── /app/uploads
       it-works acy                  ├── /app/outfits
                                     ├── /app/favorites
                                     ├── /app/history
                                     ├── /app/try-ons/:id
                                     ├── /app/settings
                                     └── /app/* (Protected 404)
```

### 8.3 Safe Redirect & Open Redirect Defenses
- Target validation is implemented in `src/lib/auth/safe-redirect.ts`.
- Post-login candidate paths from query parameters (`?returnTo=...`) and router navigation state are strictly sanitized.
- Candidates must begin with a single `/` and reside under the internal `/app` namespace.
- Absolute protocols (`https:`, `http:`), protocol-relative slashes (`//example.com`), and script schemes (`javascript:`, `data:`) are strictly rejected and normalized to `ROUTES.app.studio`.

### 8.4 Session Expiry & Token Refresh Coordinator
- **Single Refresh Coordinator**: Concurrent 401 API responses collapse into a single in-flight `POST /api/v1/auth/refresh` request.
- **Single Retry**: Original requests are retried once with the fresh bearer token.
- **Recovery Flow**: If token refresh fails, the client clears stored tokens, invalidates private query caches, and emits `vtryon:auth-expired`.
- **Calm UX**: `RequireAuth` catches the unauthenticated transition, captures the intended route (`returnTo`), and navigates to `/login` with `reason: "session-expired"`, rendering a calm notification: *"Your session ended. Sign in again to continue."*

### 8.5 Hash Navigation vs Standalone Routes
- Section anchors on the landing page (`/#how-it-works`, `/#experience`, `/#privacy`, `/#trust`) retain smooth in-page scrolling.
- Standalone policy routes (`/how-it-works`, `/privacy`, `/terms`) are independent routes with their own document titles and clean layout.

### 8.6 Try-On Resource Ownership
- Frontend routes such as `/app/try-ons/:id` are protected by `RequireAuth`.
- Resource ownership is strictly enforced by the backend API: requests for missing or other users' jobs return 404, prompting a safe resource-not-found view without client-side permission guesswork.

---

## 9. Production Authentication, Session Experience & Dual-Theme Architecture

The V Try-On web client features a hardened, production-grade authentication lifecycle designed with strict security isolation, single-flight refresh coordination, multi-tab synchronization, and complete Dark/Light theme parity.

### 9.1 Authentication Flows

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION LIFECYCLE                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. REGISTRATION                                                       │
│     POST /api/v1/auth/register (name, email, password)                 │
│     └── Backend returns TokenResponse (access_token, refresh_token)    │
│     └── Client calls establishSession(session)                         │
│     └── Immediate authenticated handoff -> Navigates to /app/studio    │
│                                                                        │
│  2. LOGIN                                                              │
│     POST /api/v1/auth/login (email, password)                          │
│     └── Backend returns TokenResponse (access_token, refresh_token)    │
│     └── Client calls establishSession(session)                         │
│     └── Safe redirect validator verifies returnTo (default: /app/studio)│
│                                                                        │
│  3. SINGLE-FLIGHT SESSION REFRESH                                      │
│     401 Unauthorized detected on protected request                     │
│     └── Collapses concurrent 401s into single POST /api/v1/auth/refresh│
│     └── Rotated tokens atomically saved; requests replayed with _retry │
│     └── If refresh fails: tokenStore.clearTokens()                     │
│     └── Dispatches vtryon:auth-expired -> Navigates to /login          │
│     └── Displays calm notification: "Your session ended. Sign in..."   │
│                                                                        │
│  4. LOGOUT & CACHE PURGE                                               │
│     POST /api/v1/auth/logout { refresh_token }                         │
│     └── Local credentials purged (tokenStore.clearTokens())            │
│     └── In-flight queries aborted (queryClient.cancelQueries())        │
│     └── Private cache wiped (queryClient.clear())                      │
│     └── Auth state transitions to unauthenticated                      │
│     └── Multi-tab storage event synchronizes sign-out across windows   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Token Storage & Production Hardening Boundary

- **Storage Isolation**: Tokens are stored strictly inside `src/lib/auth/token-store.ts`. No application components or hooks touch `localStorage` or `sessionStorage` directly.
- **Current Contract (Development)**: The backend delivers rotated credentials as JSON response bodies (`access_token`, `refresh_token`).
- **Production Hardening Recommendation**: Migrate web refresh credentials to `SameSite=Lax; HttpOnly; Secure` cookies so the web client does not hold long-lived refresh tokens in browser storage. The current frontend architecture isolates all storage access behind `tokenStore` and `client.ts`, allowing cookie migration with zero changes to UI components or hooks.

### 9.3 Cross-Tab Synchronization

The application attaches a native `window.addEventListener("storage", ...)` listener:
- When a user logs out in Tab A, Tab B immediately clears its private query cache and transitions to unauthenticated.
- When a user logs in in Tab A, Tab B automatically re-bootstraps its session.

### 9.4 Full Dark & Light Theme Support Across App Shell & Public Pages

Every page in the application supports seamless Light and Dark mode:
1. **App Shell Pages**:
   - `Fitting Studio` (`/app/studio`): High-contrast garment and portrait selectors, responsive action controls.
   - `Garment Catalogue` (`/app/outfits`): Category filter pills with active state, fashion cards with crisp borders.
   - `Saved Looks` (`/app/favorites`): Wardrobe grid with theme-adaptive empty state.
   - `Model Photos` (`/app/uploads`): Portrait manager with deletion modal and upload trigger.
   - `Generation History` (`/app/history`): Try-on grid with status badges and timestamps.
   - `Look Detail` (`/app/try-ons/:id`): Before/After split comparison slider with full pointer and keyboard controls.
   - `Account Settings` (`/app/settings`): Three-option theme selector (`Light`, `Dark`, `System`) and sign-out action.
2. **App Shell Chrome**:
   - **Header Theme Switcher**: Instant one-click toggle between Light and Dark mode in the top bar of `AppLayout`.
   - **Tailored Sidebar**: High-contrast icon and expanded modes with clean border boundaries.
   - **Mobile Tab Bar**: Elevated glassmorphic bottom bar with safe area padding.
3. **Public & Auth Screens**:
   - **Landing Header Theme Switcher**: Instant toggle available on the public landing header for both desktop and mobile.
   - **Legal Pages**: Clean editorial layout for `/privacy`, `/terms`, and `/how-it-works`.
   - **Auth Screens**: Procedural boxed grid backgrounds and cards with theme-adaptive styling and browser autofill support.

---

## 10. Upload & Person Images Experience

### 10.1 Canonical User Flow

```text
               SELECT / DRAG & DROP
                         │
                         ▼
                CLIENT PRE-CHECKS
             type / size / basic rules
                         │
                         ▼
                  BROWSER DECODE
              createImageBitmap / Image()
                         │
                ┌────────┴────────┐
                │                 │
             INVALID             VALID
                │                 │
                ▼                 ▼
          Explain issue      Local preview
                                   │
                                   ▼
                          Framing guidance
                         (non-destructive)
                                   │
                                   ▼
                            User confirms
                                   │
                                   ▼
                     Multipart upload request
                      POST /uploads/person
                                   │
                                   ▼
                         Backend validation
                                   │
                      ┌────────────┴───────────┐
                      │                        │
                    ERROR                    201
                      │                        │
                      ▼                        ▼
               Safe error state         Upload metadata
                                               │
                                               ▼
                                    Select current person
                                 vtryon_selected_person_id
                                               │
                                               ▼
                                          TRY-ON STUDIO
```

### 10.2 Supported File Formats & Validation Rules

Client-side validation guards user experience, while backend validation remains authoritative:

- **Supported Formats**: `JPEG`, `PNG`, `WebP` (MIME types: `image/jpeg`, `image/png`, `image/webp`). Obvious unsupported types (e.g. GIF, SVG, BMP, TIFF) are rejected before network transmission.
- **Maximum File Size**: **12 MB** (`12,582,912` bytes), configured in backend `settings.MAX_UPLOAD_MB = 12`. Files exceeding this limit are blocked locally.
- **Server Hard Dimension Limits**:
  - Minimum: `256 × 256` pixels.
  - Maximum: `8192 × 8192` pixels.
  - Maximum Total Pixels: `40,000,000` pixels (40 megapixels).
- **Non-Blocking Guidance Warnings**:
  - Small images (< 512px) receive a detail warning notice but are not blocked.
  - Wide landscape images (aspect ratio > 1.2) receive a portrait recommendation notice but are not blocked.

### 10.3 Browser Decode & Object URL Lifecycle

- **Dimension Extraction**: Uses browser `createImageBitmap` where supported with immediate `bitmap.close()` cleanup to free GPU memory, with an `HTMLImageElement` fallback.
- **Memory Leak Protection**: Every `URL.createObjectURL(file)` is strictly revoked via `URL.revokeObjectURL(url)` upon:
  - Selecting a new file
  - Canceling or resetting the preview
  - Completing the upload
  - Component unmounting

### 10.4 Non-Destructive Portrait Framing Guidance

- The framing overlay displays thin corner brackets, a vertical symmetry axis, and upper-third portrait breathing-room markers.
- Framing is strictly visual guidance — original image bytes are preserved without automatic destructive cropping.
- Users can toggle guidance visibility using the "Show/Hide guides" control.
- Quiet metadata displays file size, natural dimensions (`W × H px`), and image format.
- Zero fake body outlines, biometric analysis, or synthetic quality scores.

### 10.5 Multipart Upload API & Mutation Policy

- **Canonical Endpoint**: `POST /api/v1/uploads/person`.
- **Multipart Form**: `FormData.append("file", file)`.
- **Automatic Boundary**: The client does not specify `Content-Type: multipart/form-data` manually; Axios and the browser automatically compute the boundary string.
- **No Automatic Retry**: `useCreatePersonUpload` enforces `retry: false` to eliminate accidental duplicate file transmissions.
- **Honest Transfer State**: Calm "Uploading photo…" indicator without fabricated percentage bars.

### 10.6 Person Selection State & Scoped Storage

- **Selection Storage**: The active person selection is maintained in localStorage under `vtryon_selected_person_id`.
- **Privacy Boundary**: Only public upload IDs (`upl_...`) are stored — never raw image files, base64 payloads, or binary blobs.
- **Auto-Selection**: Successfully uploaded photos are automatically set as the active selection for Studio try-ons.
- **Stale ID Self-Healing**: When the upload list loads, any persisted selection not present in the active user library is automatically cleared.
- **Logout Isolation**: All person selections and query caches are wiped immediately upon user logout or session revocation.

### 10.7 Upload Library & Safe Deletion

- **Library Route**: `/app/uploads` displays the user's private photo collection with newest-first ordering.
- **Safe Deletion**: Deletion requires explicit user confirmation via `ConfirmDialog`.
- **Active Job Conflict**: If active try-on jobs depend on the upload, the backend returns HTTP `409 Conflict` (`UPLOAD_IN_USE`). The frontend surfaces a helpful alert ("This photo can't be deleted while a try-on is still using it.") and preserves the item in the UI.
- **Destructive Retry Policy**: `useDeleteUpload` enforces `retry: false`.
- **Cache Invalidation**: On successful deletion (204 No Content), the upload list is updated and any selection referencing the deleted upload is cleared.

### 10.8 Private Media Delivery

- Uploaded portraits are private to the user's account.
- Media URLs are resolved against `env.apiBaseUrl` without appending access tokens to URL query strings.
- `AuthenticatedImage` supports protected blob fetching with scoped Object URL revocation.

---

## 11. Outfit Discovery & Favorites Experience (Phase 12)

The Outfit Discovery & Favorites experience provides an editorial, image-led garment catalogue, URL-synchronized category and search filters, server pagination, an editorial side-panel detail view, optimistic favorite mutations with atomic rollback, dedicated favorites wardrobe page, and a seamless Studio selection handoff.

### 11.1 Catalogue & Discovery Architecture

```text
                    /app/outfits
                          │
                          ▼
                  URL SEARCH STATE
                category / page / search
                          │
                          ▼
                   GET /outfits
              category, search, page, page_size
                          │
                          ▼
              SERVER-PAGINATED RESULT
                          │
                          ▼
                 IMAGE-LED OUTFIT GRID
                  │          │         │
                  │          │         │
                  ▼          ▼         ▼
               Detail     Favorite   Try this
            (?outfit=id)     │         │
                             │         ▼
                             │    Select outfit
                             │         │
                             │         ▼
                             │    /app/studio
                             │
                ┌────────────┴────────────┐
                │                         │
              FAVORITE                UNFAVORITE
                │                         │
                ▼                         ▼
       optimistic UI update     optimistic UI update
                │                         │
                ▼                         ▼
 PUT /outfits/{id}/favorite   DELETE /outfits/{id}/favorite
                 │                         │
          ┌──────┴──────┐           ┌──────┴──────┐
          │             │           │             │
        SUCCESS        ERROR       SUCCESS        ERROR
          │             │           │             │
        keep          rollback      keep          rollback
          │             │           │             │
          └─────────────┴───────────┴─────────────┘
                           │
                           ▼
                 Reconcile Query Caches
```

### 11.2 API Mapping Contract

| Frontend Action | Canonical Backend Endpoint | Description |
| --------------- | -------------------------- | ----------- |
| List outfits | `GET /api/v1/outfits` | Paginated catalogue listing with `category` and `search` query parameters |
| Outfit detail | `GET /api/v1/outfits/{outfit_id}` | Retrieve single garment details by public ID (`out_...`) |
| Favorite outfit | `PUT /api/v1/outfits/{outfit_id}/favorite` | Idempotent addition to user favorites (204 No Content) |
| Unfavorite outfit | `DELETE /api/v1/outfits/{outfit_id}/favorite` | Idempotent removal from user favorites (204 No Content) |
| List favorites | `GET /api/v1/favorites` | Paginated list of favorited garments in newest-first order |

### 11.3 Category Filter Mapping

The UI reflects the actual CatVTON model capabilities and backend category enum:
- `upper_body` → **Tops**
- `lower_body` → **Bottoms**
- `dresses` → **Dresses**
- **All**: When the user selects "All", the `category` search parameter is omitted from both the URL and the API request to fetch unfiltered catalogue items.
- Non-existent categories (e.g. Shoes, Accessories, Outerwear, Bags) are never exposed.

### 11.4 URL-Safe Filtering & Server Pagination

- **URL State**: Category (`?category=...`), server page (`?page=...`), debounced search (`?search=...`), and open detail (`?outfit=...`) are synchronized in React Router search params.
- **Param Normalization**: Invalid category parameters are stripped, non-numeric or negative page parameters default safely to `1`, and default values are omitted to keep URLs clean.
- **Page Resets**: Changing the active category or typing a search term automatically resets pagination to page 1.
- **Server Pagination**: Uses backend `pagination: { page, page_size, total, total_pages }`. Pagination controls are keyboard accessible (`aria-label="Outfit pages"`, `aria-current="page"`).

### 11.5 Optimistic Favorites & Rollback

- **Immediate Feedback**: Clicking the favorite button immediately updates the UI without waiting for network latency.
- **Comprehensive Cache Synchronization**: Updates all cached instances of the outfit across catalogue list pages, outfit detail, and the favorites page.
- **Pending Isolation**: Mutation pending states are isolated per `outfitId`. Toggling outfit A never disables or freezes buttons on outfit B.
- **Atomic Rollback**: If the server rejects the mutation or returns an error, the previous cache snapshot is immediately restored and a discreet toast notice informs the user.
- **No Automatic Retry**: Enforces `retry: false` on favorite mutations.

### 11.6 URL-Backed Detail Experience (Option B)

- **Deep-Linkable & Refresh-Safe**: Outfit details are rendered inside a URL-backed editorial side panel (`?outfit=out_...`) using `@base-ui/react/dialog` (`Sheet`).
- **Context Preservation**: Opening or closing the detail drawer preserves the active catalogue position, search query, and category filters.
- **Garment-Dominant Presentation**: Features large `aspect-[3/4]` garment imagery (`objectFit="contain"` on neutral background), full name, category badge, and styling description.
- **Safe 404 Recovery**: Missing or deactivated outfits render an `ErrorState` with options to try again or dismiss.

### 11.7 Studio Handoff & Selection

- **Selection Persistence**: The selected garment ID is stored in localStorage (`vtryon_selected_outfit_id`) and synchronized across tabs.
- **Try This Outfit**: Clicking "Try this outfit" sets the active garment in `useCurrentOutfit()` and navigates to `/app/studio` via `ROUTES.app.studio`.
- **Zero Premature Inference**: Selecting an outfit never automatically submits a try-on job; the user must confirm both a person photo and garment in the Studio.
- **Stale Selection Handling**: If a previously selected outfit is deactivated or removed (404), the selection automatically self-heals and clears.

### 11.8 User & Session Isolation

- **Private Favorite State**: All outfit catalogue queries and favorite lists are treated as user-specific data.
- **Logout Teardown**: Upon user logout or session revocation, `useAuth` invokes `clearSelectedOutfit()`, wipes the TanStack Query cache, and clears stored tokens to eliminate any risk of User A's favorites flashing for User B.

---

## 12. Virtual Try-On Studio

### 12.1 Canonical User Flow

```text
/app/studio
     ↓
Select person
     ↓
Select outfit
     ↓
Generate
     ↓
POST /api/v1/try-ons
     ↓
202 + job ID
     ↓
/app/try-ons/{jobId}
     ↓
GET /api/v1/try-ons/{jobId}
     ↓
 queued ─────→ processing
                  │
          ┌───────┴────────┐
          │                │
       succeeded         failed
          │                │
        result          failure UI
```

### 12.2 Mental Model & Responsibilities

The Studio (`/app/studio`) is the primary hero experience of **V Try-On**. It guides the user through a simple, high-trust fashion workflow:
1. **Choose yourself**: Select or upload an editorial portrait or full-body photo.
2. **Choose an outfit**: Select a garment from the catalogue.
3. **Create the try-on**: One deliberate click submits the job.
4. **Wait truthfully**: Adaptive polling with truthful indeterminate state.
5. **View the result**: Private authenticated result delivery with interactive original comparison.

The Studio never exposes machine-learning or infrastructure internals (`CatVTON`, `Celery`, `Redis`, `GPU`, `DensePose`, `SCHP`, checkpoint loading, inference steps, or worker queue internals) to users.

### 12.3 API & Data Contract

#### Submission Request
- **Endpoint**: `POST /api/v1/try-ons`
- **Status**: `202 Accepted`
- **Request Body**: Strictly minimal canonical IDs:
  ```json
  {
    "person_upload_id": "upl_01J...",
    "outfit_id": "out_01J..."
  }
  ```
  No user ID, image URLs, filenames, model parameters, or synthetic progress values are ever sent.
- **Header**: Supports optional `Idempotency-Key` for replay deduplication.

#### Job Polling & Status
- **Endpoint**: `GET /api/v1/try-ons/{job_id}`
- **Response**: `ApiResponse<TryOnResponse>`
- **Authoritative Statuses**: Strictly `queued` | `processing` | `succeeded` | `failed`. No synthetic `cancelled`, `pending`, `running`, or `complete` states exist in V1.

#### Private Result Media
- **Endpoint**: `GET /api/v1/try-ons/{job_id}/content`
- **Delivery**: Authenticated binary stream with `Cache-Control: private, no-cache`. Media is fetched via `apiClient.get(url, { responseType: "blob" })`, converted into a secure `blob:` URL, and rendered using `AuthenticatedImage` or `ImageCompare`. Object URLs are automatically revoked when the result changes or components unmount.

### 12.4 Double-Submit & Mutation Retry Policy

- **No Automatic Retry**: `useCreateTryOn` sets `retry: false`. `POST /try-ons` creates a durable server resource; retrying without idempotency could create duplicate jobs.
- **Double-Submit Lock**: Both component state and synchronous ref guards (`isSubmittingRef`) prevent duplicate submissions during rapid clicks, Enter spamming, or touch events.
- **Pending Copy**: Uses `Starting your try-on…` while awaiting the HTTP 202 response.

### 12.5 202 Job Handoff & Cache Seeding

Upon receiving HTTP 202:
1. The returned job record is immediately seeded into the TanStack Query cache: `queryClient.setQueryData(tryOnKeys.detail(job.id), job)`.
2. The try-on history list is invalidated: `queryClient.invalidateQueries({ queryKey: tryOnKeys.lists() })`.
3. The router immediately navigates to the canonical job detail route: `/app/try-ons/:jobId`.

### 12.6 Truthful Adaptive Polling Policy

To prevent aggressive backend hammering while maintaining high responsiveness:
- **0 – 15s elapsed**: 2,000ms
- **15 – 45s elapsed**: 3,000ms
- **45 – 120s elapsed**: 5,000ms
- **> 120s elapsed**: 8,000ms
- **Terminal Statuses (`succeeded`, `failed`)**: Polling interval immediately returns `false` (stops).
- **Tab Inactivity**: When `document.visibilityState === "hidden"`, polling pauses (`refetchInterval: false`). When the tab becomes visible again, an immediate `refetch()` is fired and adaptive polling resumes.
- **Job Switch**: Reset start time and elapsed backoff on `jobId` transition.
- **Route Exit**: Polling terminates naturally when components unmount; no orphaned intervals remain.

### 12.7 Truthful Indeterminate Progress

- **No Fake Percentages**: The frontend never calculates or displays synthetic percentages (`17%`, `43%`, `82%`).
- **No Invented Pipeline Steps**: The UI does not fabricate internal pipeline phases like "Detecting garment" or "Enhancing face".
- **No ETAs**: No estimated times or queue positions are shown without backend truth.
- **Human Status Copy**:
  - `queued` → **Waiting to start**
  - `processing` → **Creating your try-on**
  - `succeeded` → **Your look is ready**
  - `failed` → **We couldn't finish this try-on**
- **Reduced Motion**: Respects `prefers-reduced-motion` with static icons and no continuous animations.

### 12.8 Result Viewing & Visual Comparison

- **Visually Dominant**: Generated results take center stage with `objectFit="contain"` framing.
- **Interactive Comparison**: When original portrait is available, users can toggle between Result and "Compare with Original" powered by `ImageCompare` with pointer drag and keyboard controls (Arrow keys, Home, End).
- **Action Affordances**:
  - **Try another outfit**: Clears the outfit selection, preserves the person photo, and navigates to Studio for rapid iterative exploration.
  - **New try-on**: Returns to Studio preserving selections.
  - **Download look**: Triggers an authenticated blob download with clean filename `v-try-on-${job.id}.jpg`.

### 12.9 Safe Failure Recovery

- When a job fails, polling stops immediately.
- Backend error codes (`INVALID_INPUT`, `TRYON_PROCESSING_FAILED`, `RESULT_STORAGE_FAILED`, `USER_TRYON_CAPACITY_EXCEEDED`, `SYSTEM_TRYON_CAPACITY_UNAVAILABLE`) are mapped to friendly, actionable guidance.
- Technical details, stack traces, CUDA errors, and Celery worker diagnostics are strictly suppressed from the UI.
- Recovery actions: "Try again in Studio" preserves the user's selections so they can make adjustments or resubmit deliberately. No automatic retries are performed.

---

## 13. Job Progress, Results & History (Phase 14)

Implementation of the complete asynchronous post-generation, result presentation, and try-on history experience.

### 13.1 Canonical Status Model

The frontend strictly mirrors the authoritative backend V1 lifecycle (`backend/app/schemas/tryon.py`):

| Backend State | Frontend Presentation | UX Semantics |
| :--- | :--- | :--- |
| `queued` | **Waiting to start** | Request is queued in durable storage; generation begins as soon as worker capacity is allocated. |
| `processing` | **Creating your look** | Indeterminate creation state; AI pipeline synthesizing garment drape and contour. |
| `succeeded` | **Your look is ready** | Terminal success; private result image available for viewing, comparison, and download. |
| `failed` | **Couldn't finish** | Terminal failure; safe actionable guidance presented with option to retry in Studio. |

> [!IMPORTANT]
> - `cancelled` is **not** implemented in V1 backend architecture; no fake cancel buttons exist.
> - `deleted` is a resource lifecycle outcome, not a processing status.

### 13.2 Polling Lifecycle & Inactivity Handling

Polling is managed canonically by `useTryOnJob`:

```text
GET /api/v1/try-ons/{jobId}
           │
           ▼
   queued / processing
           │
           ▼
    adaptive polling ladder (2s → 3s → 5s → 8s)
           │
     ┌─────┴─────┐
     ▼           ▼
 succeeded     failed
     │           │
stop polling  stop polling
     │           │
ResultViewer  TryOnFailure
```

- **Adaptive Ladder**: 2s for 0-15s, 3s for 15-45s, 5s for 45-120s, and 8s beyond 120s.
- **Hidden Tab Policy**: Polling pauses completely when the document is hidden (`refetchInterval: false`). When the tab regains focus/visibility, an immediate `refetch()` executes and adaptive polling resumes if still active.
- **Network Resilience**: Transient network GET errors preserve last-known job status. Only an authoritative server response with `status: "failed"` transitions the job to failed.
- **Terminal Invariant**: As soon as `status` becomes `succeeded` or `failed`, polling stops immediately and never re-polls.

### 13.3 Truthful Indeterminate Progress UX

- **Zero Synthetic Percentages**: The frontend does not calculate or invent artificial percentage values (`23%`, `68%`, `99%`).
- **Zero Invented Steps**: No fake progress stages ("Detecting pose", "Generating fabric") are fabricated.
- **No ETAs**: No estimated wait times or arbitrary queue positions are presented without backend truth.
- **Reduced Motion**: Under `prefers-reduced-motion: reduce`, animations are disabled and static status indicators are rendered.

### 13.4 Private Result Media Delivery & Object URL Lifecycle

- **Authenticated Delivery**: Result images are served from `/api/v1/try-ons/{job_id}/content` with `Cache-Control: private, no-cache` requiring Bearer authorization.
- **Zero Token Leaks**: Access tokens are never placed into URL query parameters (`?token=...`).
- **Object URL Management**: Media is fetched as binary blobs via `apiClient.get(url, { responseType: "blob" })`, converted via `URL.createObjectURL(blob)`, and rendered using `AuthenticatedImage` or `ImageCompare`.
- **Guaranteed Cleanup**: All Object URLs are cleanly revoked on image change, component unmount, deletion, or session logout via `URL.revokeObjectURL(url)`.

### 13.5 Interactive Compare & Native Download

- **Interactive Comparison**: `ImageCompare` allows smooth slider comparison between the user's original portrait and the AI-generated fitting result.
- **Accessible Controls**: Supports pointer drag, touch dragging with generous hit areas, and keyboard navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`).
- **Secure Download**: Download streams the authenticated binary blob, creates a temporary anchor with sanitized filename `v-try-on-${job.id}.jpg`, triggers browser download, and revokes the blob URL.

### 13.6 Durable History & Server Pagination

- **Endpoint**: `GET /api/v1/try-ons` with `page` and `page_size` parameters.
- **URL Synchronization**: The active page is reflected in URL search parameters (`/app/history?page=2`).
- **Zero N+1 Queries**: History items (`TryOnListItem`) contain embedded `TryOnOutfitSummary` (`thumbnail_url`, `name`, `category`) and `TryOnResultSummary` (`image_url`, `width`, `height`). No card-level detail or outfit queries are issued.
- **Failed Job Durability**: Failed jobs remain durably visible in history until explicitly deleted by the user, providing full auditability of past attempts.
- **Responsive Layout**: Image-led cards adapting from 1 column on mobile, 2-3 on tablet, to 3-4 columns on desktop.

### 13.7 Terminal Job Deletion Semantics

- **Endpoint**: `DELETE /api/v1/try-ons/{job_id}` responding with `204 No Content`.
- **Deletable States**: Only terminal jobs (`succeeded`, `failed`) can be deleted.
- **Active Job Conflict**: Active jobs (`queued`, `processing`) reject deletion with `409 Conflict` (`TRYON_JOB_IN_PROGRESS`). Deletion is not cancellation.
- **Confirmation Dialog**: Accessible `ConfirmDialog` traps focus, supports Escape, and explains that history and generated result files will be removed.
- **Cache Invalidation**: On successful deletion, the detail query is removed from cache (`queryClient.removeQueries({ queryKey: tryOnKeys.detail(jobId) })`) and history lists are invalidated (`queryClient.invalidateQueries({ queryKey: tryOnKeys.lists() })`). If deleting from the detail page, navigation replaces to `/app/history` to avoid stale browser Back navigation.

### 13.8 Session Isolation

- **Query Cache Purge**: `useLogout` calls `queryClient.clear()`, wiping all try-on jobs, results, and history lists.
- **Zero Cross-User Flash**: No previous-user imagery or jobs flash upon logging in with another account.

## 14. API Client & Contract Layer, Typed Transport & Canonical Networking Discipline

### 14.1 Architecture Overview

All network communication across the V Try-On web application flows through a unified, contract-driven networking foundation. This layer guarantees:
1. **Single Canonical HTTP Client**: One central `apiClient` manages all authenticated JSON, multipart, and binary media requests.
2. **Dedicated Bare Client**: A lightweight `bareClient` is reserved for unauthenticated refresh operations to structurally eliminate infinite interceptor loops.
3. **Canonical Base URL & Route Prefix**: Environment configuration (`src/config/env.ts`) exclusively provides `VITE_API_BASE_URL`. All endpoints are prefixed with `/api/v1` centrally.
4. **Typed Response Envelopes & Safe Unwrapping**: Backend success envelopes `{ success: true, data: T }` are transparently unwrapped via `apiRequest<T>`, while `204 No Content` responses safely resolve to `void` without JSON parsing.
5. **Unified Error Normalization**: All transport, HTTP, and backend application errors are normalized into `AppApiError` with structured field errors (`Record<string, string[]>`), tracing Request IDs, and sanitized user-facing messages.
6. **Single-Flight 401 Recovery**: Concurrent 401 responses merge into a single shared refresh operation. Rotated tokens are atomically updated, and original requests are replayed exactly once.
7. **Cross-Feature Architectural Discipline**: UI components and pages never import Axios or invoke raw `fetch()`. Endpoint ownership is strictly partitioned by feature with zero duplication.

### 14.2 Canonical Endpoint Ownership Map

| Method | Endpoint | Frontend Owner | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | `features/auth` | User account registration |
| `POST` | `/auth/login` | `features/auth` | User authentication & token issuance |
| `POST` | `/auth/refresh` | `lib/auth` / `lib/api` | Token rotation & session refresh (via `bareClient`) |
| `POST` | `/auth/logout` | `features/auth` | Session revocation (resolves 204 No Content) |
| `GET` | `/users/me` | `features/auth` | Canonical current-user boundary for session bootstrap & account |
| `POST` | `/uploads/person` | `features/uploads` | Multipart person image upload |
| `GET` | `/uploads` | `features/uploads` | Paginated person image library |
| `GET` | `/uploads/{upload_id}` | `features/uploads` | Person upload detail |
| `DELETE` | `/uploads/{upload_id}` | `features/uploads` | Person image deletion (resolves 204 No Content) |
| `GET` | `/outfits` | `features/outfits` | Paginated outfit catalogue with category filters |
| `GET` | `/outfits/{outfit_id}` | `features/outfits` | Outfit detail and metadata |
| `PUT` | `/outfits/{outfit_id}/favorite` | `features/favorites` | Add outfit to favorites (resolves 204 No Content) |
| `DELETE` | `/outfits/{outfit_id}/favorite` | `features/favorites` | Remove outfit from favorites (resolves 204 No Content) |
| `GET` | `/favorites` | `features/favorites` | Paginated user favorites collection |
| `POST` | `/try-ons` | `features/try-on` | Async virtual try-on job creation (returns 202 Accepted) |
| `GET` | `/try-ons` | `features/try-on` (consumed by `history`) | Paginated try-on history list (zero duplication) |
| `GET` | `/try-ons/{job_id}` | `features/try-on` | Try-on job status, progress, and result metadata |
| `DELETE` | `/try-ons/{job_id}` | `features/try-on` | Terminal job deletion (resolves 204 No Content) |

### 14.3 Client Request & Response Pipeline

```text
                       FEATURE HOOK
                            │
                            ▼
                    FEATURE API FUNCTION
                            │
                            ▼
                        apiRequest
                            │
                            ▼
                        apiClient
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
        X-Request-ID              Authorization Header
      (crypto.randomUUID)        Bearer <access_token>
             │                             │
             └──────────────┬──────────────┘
                            │
                            ▼
                     FASTAPI BACKEND
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
       SUCCESS (2xx)                  ERROR (4xx / 5xx)
             │                             │
    ┌────────┴────────┐           ┌────────┴────────┐
    ▼                 ▼           ▼                 ▼
Status 204        Status 200     401 Auth        Other Error
(No Content)    (Envelope Body)  Failure         (400, 422, 500)
    │                 │           │                 │
Resolve void    Unwrap .data   Single-Flight    normalizeApiError
                               Refresh & Replay     │
                                  │                 ▼
                                  └──────────► AppApiError
```

### 14.4 Single-Flight 401 Refresh & Replay Pipeline

```text
Request A ──401──┐
Request B ──401──┼──► Active Refresh? ──YES──► Await Existing Promise
Request C ──401──┘            │
                              NO
                              ▼
                      coordinateTokenRefresh()
                              │
                      bareClient.post('/auth/refresh')
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
            SUCCESS                       FAILURE
               │                             │
      Atomic Token Store             Clear Tokens & Emit
    (new access & refresh)           'vtryon:auth-expired'
               │                             │
       Replay Each Request            Reject All Waiters
      Once (_retry: true)             (Session Terminated)
               │
      If Replay 401:
      Do NOT loop. Terminate session.
```

### 14.5 Error Normalization Specification

Every failure received by the application is transformed via `normalizeApiError()` into an `AppApiError` instance:

```ts
export class AppApiError extends Error {
  readonly code: string
  readonly status: number
  readonly requestId?: string
  readonly fieldErrors?: Record<string, string[]>
  readonly retryAfterSeconds?: number
  readonly details?: unknown
}
```

Key normalization rules:
- **422 Validation Errors**: Backend details (`[{ loc: ['body', 'email'], msg: '...' }]` or `[{ field: 'email', message: '...' }]`) are normalized to `fieldErrors: { email: ['...'] }`. Prefix segments (`body.`, `query.`, `path.`) are stripped. Sensitive field contents (passwords, tokens) are never echoed.
- **429 Rate Limiting**: The `Retry-After` header is parsed and exposed as `retryAfterSeconds: number` for countdown UI.
- **500 Server Errors**: Internal stack traces or paths are never exposed to users; sanitized copy is always rendered ("Our servers are having trouble right now. Please try again shortly.").
- **Network Outages**: Requests with no response resolve to `status: 0` and `code: "NETWORK_ERROR"`.
- **Timeouts**: `ECONNABORTED` failures map to `status: 408` and `code: "TIMEOUT_ERROR"`.
- **Request Cancellations**: Component unmounts or aborted signals map to `code: "REQUEST_CANCELLED"` and do not trigger error toasts.

### 14.6 204 No Content Handling

Endpoints responding with `204 No Content` (`POST /auth/logout`, `PUT /outfits/{id}/favorite`, `DELETE /outfits/{id}/favorite`, `DELETE /uploads/{id}`, `DELETE /try-ons/{id}`) are intercepted before JSON parsing. `apiRequest()` returns `Promise<void>` with value `undefined`. No invalid JSON parse errors occur.

### 14.7 Multipart Form-Data Handling

Multipart requests (`POST /uploads/person`) pass native `FormData` instances to `apiClient.post()`. 
**Invariant**: The client never sets the `Content-Type` header manually for multipart requests, allowing the browser to construct the correct header with dynamic MIME boundary tokens (`multipart/form-data; boundary=----WebKitFormBoundary...`).

### 14.8 Authenticated Private Media Streaming

Private image assets (`/api/v1/try-ons/{job_id}/content` and `/api/v1/uploads/person/{upload_id}/content`) are retrieved using `fetchAuthenticatedBlob(pathOrUrl, signal)`:
- Invokes `apiClient.get(url, { responseType: 'blob', signal })`.
- Carries Bearer Authorization and Tracing Request ID.
- Seamlessly recovers from expired access tokens via single-flight 401 refresh.
- If an error returns as a JSON Blob (`Blob.type === 'application/json'`), the error interceptor reads the blob text and parses it into `ApiErrorPayload` before running `normalizeApiError()`.
- Never appends sensitive tokens to URL query parameters (`?token=...`).

### 14.9 Architecture Test Invariants

Automated architecture tests in `tests/architecture/` continuously enforce:
1. **Zero UI Axios/Fetch**: No UI components or pages import Axios or invoke raw `fetch()`.
2. **Zero Direct Auth Token Access**: Local/session storage token manipulation is strictly isolated to `src/lib/auth/token-store.ts`.
3. **Zero Direct Refresh Calls**: `bareClient.post('/auth/refresh')` is exclusively invoked within `src/lib/api/refresh-coordinator.ts`.
4. **Environment Isolation**: `import.meta.env` is only accessed within `src/config/env.ts`.
5. **Zero Token/Password Logging**: Console logging of passwords, tokens, or authorization headers is strictly prevented.
6. **Zero Legacy Route Drift**: No references to stale paths (`/favorites/{id}`, `/tryons`, `/try-ons/{id}/result`, `/uploads/person-images`, `/history`) exist in the codebase.

## 15. State Management & Data Fetching Architecture, TanStack Query Ownership & Studio Selection State

### 15.1 Core State Ownership Model

Every piece of state in the V Try-On frontend has exactly one appropriate owner:

| State | Canonical Owner | Storage / Mechanism | Description |
| :--- | :--- | :--- | :--- |
| **Auth Session & Status** | `AuthProvider` & `lib/auth/token-store.ts` | Memory + HTTP Bearer headers | Manages `status: "unknown" \| "authenticated" \| "unauthenticated"` and cross-tab storage sync |
| **Current User Data** | TanStack Query (`authKeys.me()`) | In-memory Query Cache | Authoritative `/api/v1/users/me` cache seeded at login and purged on session termination |
| **User Uploads Library** | TanStack Query (`uploadKeys`) | In-memory Query Cache | Server list populated via `GET /api/v1/uploads` and invalidated upon upload/delete |
| **Outfit Catalogue** | TanStack Query (`outfitKeys`) | In-memory Query Cache | Garments loaded via `GET /api/v1/outfits` with normalized category/search parameters |
| **User Favorites** | TanStack Query (`favoriteKeys`) | In-memory Query Cache | Optimistically updated on favorite/unfavorite toggle with automatic snapshot rollback |
| **Try-On Active Jobs** | TanStack Query (`tryOnKeys.detail`) | In-memory Query Cache | Dynamic adaptive polling ladder while job is `queued` or `processing`; terminates when terminal |
| **Try-On History** | TanStack Query (`tryOnKeys.list`) | In-memory Query Cache | Server-paginated history items via `GET /api/v1/try-ons` with zero card-level duplicate queries |
| **Studio Person Selection** | React Router (`useStudioSelection`) | URL Search Params (`?person=...`) | Refresh-safe, linkable, Back/Forward-safe; validated against active library and purged if missing |
| **Studio Outfit Selection** | React Router (`useStudioSelection`) | URL Search Params (`?outfit=...`) | Refresh-safe, linkable, Back/Forward-safe; validated against outfit detail and purged if missing |
| **Filters & Pagination** | React Router (`useOutfitFilters`, `useHistoryPagination`) | URL Search Params (`?page=...&category=...`) | Shareable, refresh-safe route state driving Query keys |
| **Form Data** | React Hook Form | Component Local State | Auth and profile form validation drafts; never mirrored into global server stores |
| **Dialogs, Drawers & Sheets** | Local React State (`useState`) | Component Memory | Ephemeral open/closed state reset naturally upon unmount |
| **Interactive Compare Slider** | Local React State (`useState`) | Component Memory | Split position for before/after comparison; transient presentation state |
| **Upload Pre-decode Preview** | Local React State (`useState`) | Component Memory + Object URL | Local file preview, dimensions, and framing warnings before network upload |
| **Theme Preference** | `ThemeProvider` (`src/lib/theme/`) | `localStorage` (`vtryon-theme`) | Persistent user preference (`system \| light \| dark`); survives logout without data leak |

### 15.2 QueryClient Defaults & Private Cache Invariants

Application source maintains exactly one canonical `QueryClient` (`src/app/query-client.ts`):
- **Queries**:
  - `staleTime: 60_000` (1 minute).
  - `gcTime: 600_000` (10 minutes).
  - `refetchOnWindowFocus: true` for focus recovery.
  - `refetchOnReconnect: true` for automatic reconnect synchronization.
  - `retry: (failureCount, error) => ...`: Excludes non-retryable 4xx client errors (`400`, `401`, `403`, `404`, `409`, `413`, `415`, `422`, `429`).
- **Mutations**:
  - `retry: false`: Mutations are never auto-retried globally to prevent duplicate jobs, uploads, or deletes.

#### User Isolation & Private Cache Purge (`clearPrivateQueryState`)
On user logout or session expiration, `clearPrivateQueryState(queryClient)` is invoked:
1. In-flight requests are immediately aborted via `queryClient.cancelQueries()`.
2. All user-scoped caches are completely removed:
   - `authKeys.all` (`["auth"]`)
   - `uploadKeys.all` (`["uploads"]`)
   - `outfitKeys.all` (`["outfits"]`) *(contains user-specific `is_favorite` flags)*
   - `favoriteKeys.all` (`["favorites"]`)
   - `tryOnKeys.all` (`["try-ons"]`)
3. Theme preference in `localStorage` (`vtryon-theme`) is intentionally preserved as a device-level setting.

### 15.3 Hierarchical Query Key Factories

All queries and mutations strictly use feature-owned hierarchical query key factories:

```ts
// Auth
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
}

// Uploads
export const uploadKeys = {
  all: ["uploads"] as const,
  lists: () => [...uploadKeys.all, "list"] as const,
  list: (params?: { page?: number; page_size?: number }) =>
    [...uploadKeys.lists(), params ?? {}] as const,
  details: () => [...uploadKeys.all, "detail"] as const,
  detail: (id: string) => [...uploadKeys.details(), id] as const,
}

// Outfits
export const outfitKeys = {
  all: ["outfits"] as const,
  lists: () => [...outfitKeys.all, "list"] as const,
  list: (params?: OutfitListParams) =>
    [...outfitKeys.lists(), params ?? {}] as const,
  details: () => [...outfitKeys.all, "detail"] as const,
  detail: (id: string) => [...outfitKeys.details(), id] as const,
}

// Favorites
export const favoriteKeys = {
  all: ["favorites"] as const,
  lists: () => [...favoriteKeys.all, "list"] as const,
  list: (params?: { page?: number; page_size?: number }) =>
    [...favoriteKeys.lists(), params ?? {}] as const,
}

// Try-Ons
export const tryOnKeys = {
  all: ["try-ons"] as const,
  lists: () => [...tryOnKeys.all, "list"] as const,
  list: (params?: { page?: number; page_size?: number; status?: string }) =>
    [...tryOnKeys.lists(), params ?? {}] as const,
  details: () => [...tryOnKeys.all, "detail"] as const,
  detail: (jobId: string) => [...tryOnKeys.details(), jobId] as const,
}
```

Key features:
- **Collision Prevention**: Distinct `list` and `detail` namespaces structurally prevent collisions between detail IDs and list filter objects.
- **Normalized Params**: Passing `undefined` or `{}` produces identical cache keys (`params ?? {}`).

### 15.4 Canonical Studio Selection via URL State

Virtual Try-On Studio selection state is managed exclusively through URL search parameters:

```text
/app/studio?person=upl_abc123&outfit=out_xyz456
```

- **Hook**: `useStudioSelection()` in `src/features/try-on/hooks/use-studio-selection.ts`.
- **Properties**:
  - `personUploadId`: Opaque string ID or `null`.
  - `outfitId`: Opaque string ID or `null`.
  - `setPersonUploadId(id)`: Sets/deletes `person`, preserving `outfit`, with `{ replace: true }`.
  - `setOutfitId(id)`: Sets/deletes `outfit`, preserving `person`, with `{ replace: true }`.
  - `clearPersonUpload()`: Removes `person`, preserving `outfit`.
  - `clearOutfit()`: Removes `outfit`, preserving `person`.
  - `clearAll()`: Clears all selections from URL.
- **Automatic Self-Healing**:
  - If `personUploadId` does not exist in the user's active upload library, it is automatically purged from the URL.
  - If `outfitId` fails to load (e.g. 404 or inactive), it is automatically purged from the URL.
- **Handoff Flows**:
  - **Uploads** ("Use in Studio"): `ROUTES.app.studioWithParams({ person: uploadId })`.
  - **Outfits / Favorites** ("Try this outfit"): `ROUTES.app.studioWithParams({ outfit: outfit.id })`.
  - **Failed Jobs** ("Try again"): `ROUTES.app.studioWithParams({ person: job.person_upload_id, outfit: job.outfit_id })`.
  - **Completed Result** ("Try another outfit"): `ROUTES.app.studioWithParams({ person: job.person_upload_id })`.

### 15.5 Theme Persistence & Flash Prevention

- **Storage Key**: `localStorage.getItem("vtryon-theme")` with values `"system" | "light" | "dark"`.
- **System Listener**: If set to `"system"`, listens to `prefers-color-scheme` changes.
- **Flash Prevention**: An inline script in `index.html` evaluates the stored theme before the React root renders, preventing visual flickering during initial page loads.

## 16. Forms, Validation and Error Handling Architecture (Phase 17)

Phase 17 establishes an authoritative, uniform form validation and error handling architecture across the **V Try-On** frontend.

### 16.1 Error Treatment Matrix

| Error Type | Treatment & UX Mechanism | Canonical Representation |
| :--- | :--- | :--- |
| **400 / 422 Validation** | Inline form field errors (`setError`) when matching fields exist; non-field or unmapped errors fall back to contextual alert banner (`AuthFormError`). | `AppApiError.fieldErrors` populated from both array and dictionary validation details. |
| **401 Unauthorized** | Single-flight refresh coordination (`coordinateTokenRefresh`) on authenticated endpoints with replay-once (`_retry`). If refresh fails, tokens are cleared and `vtryon:auth-expired` ends session. Auth endpoints skip refresh and render inline/contextual feedback. | `INVALID_CREDENTIALS` / `SESSION_EXPIRED`. |
| **403 Forbidden** | Clear permission message without blind retries. Excluded from TanStack Query automatic retry loop. | `FORBIDDEN` ("You do not have permission to access this resource."). |
| **404 Not Found** | Dedicated not-found states with truthful explanations and explicit recovery links (Open Studio, Browse Looks, Back to history). | Dedicated `ErrorState` components in `try-on-detail-page.tsx`, `outfit-detail-panel.tsx`, and `ProtectedNotFoundPage`. |
| **409 Conflict** | Truthful conflict copy for duplicate accounts (`EMAIL_ALREADY_EXISTS`), active generations (`TRYON_JOB_ACTIVE`), state transitions (`TRYON_INVALID_STATE`), and locked photos (`UPLOAD_IN_USE`). Duplicate email mapped directly to `email` field error. | Inline field error on `email` and contextual banner. |
| **413 Upload Too Large** | Truthfully states the configured limit (12 MB) in pre-decode checks, dropzone instructions, and network failure messages. | `UPLOAD_TOO_LARGE` / `IMAGE_TOO_LARGE` ("This image exceeds the 12 MB upload limit. Please select a smaller file."). |
| **429 Rate Limit** | Displays rate limit message with live second-by-second countdown timer (`useRateLimitCountdown`), temporarily gating retry affordances until timer expiration. | `RATE_LIMIT_EXCEEDED` + `Retry-After` header extraction into `retryAfterSeconds`. |
| **5xx / Network** | Sanitized user-facing messages (zero backend tracebacks leaked), tracing `Reference: <requestId>`, and manual "Try again" retry actions. | `INTERNAL_SERVER_ERROR`, `NETWORK_ERROR`, `TIMEOUT_ERROR`. |

### 16.2 Zod Schemas & Backend Authoritativeness

- **Frontend Role**: Zod schemas (`loginSchema`, `registerFormSchema`) mirror immediate frontend interface requirements (input presence, email syntax, password minimum length, password confirmation matching).
- **Backend Role**: The backend remains strictly authoritative for business logic, uniqueness constraints, credential verification, and image processing pipeline checks.
- **Error Translation**: The `applyServerValidationErrors()` utility bridges backend validation envelopes into React Hook Form state, seamlessly populating field-level errors without tight coupling.

### 16.3 Toast Notification Discipline

Toasts (`sonner`) are strictly reserved for cross-form or global outcomes:
- Photo added / deleted
- Try-on job deleted
- Garment added to / removed from favorites

Inline forms (`LoginForm`, `RegisterForm`, `TryOnComposer`, and `PersonUploadDropzone`) **never** fire toasts for validation failures, maintaining a quiet, predictable, and localized user experience.

## 17. Motion and Interaction System (Phase 18)

Phase 18 establishes a comprehensive, restrained, and accessible motion system powered by Motion for React (`motion/react`). Motion in **V Try-On** makes image selection and asynchronous transitions feel intentional, editorial, and calm rather than flashy.

### 17.1 Motion Matrix & Interaction Contract

| Interaction | Motion Specification | Implementation Details |
| :--- | :--- | :--- |
| **Route change** | Small opacity/translate transition scoped strictly to page content, not the whole app shell. | `<PageTransition>` in `src/components/layout/page-transition.tsx` wraps `<Outlet />` inside `#main-content`. The sidebar, header, and mobile navigation remain completely static. Duration: 0.18s, `opacity: 0, y: 6` to `opacity: 1, y: 0`. |
| **Outfit selection** | Shared layout highlight / border transition. | Selected outfits in `OutfitSelector` and `OutfitCard` render a shared spring selection ring using `layoutId="outfit-picker-selection-ring"` and `layoutId="outfit-card-active-border"` (`stiffness: 450, damping: 35`). |
| **Person selection** | Shared layout highlight / border transition. | Selected model photos in `PersonSelector` and `UploadCard` render a shared spring selection ring using `layoutId="person-picker-selection-ring"` and `layoutId="upload-card-selection-ring"`. |
| **Upload completed** | Preview settles into selected state; no celebratory particle effects. | In `PersonUploadPreview`, the confirmed image preview settles gently into place (`initial={{ opacity: 0.85, scale: 0.98 }}` to `scale: 1, opacity: 1`). Confetti, fireworks, and particle libraries are strictly prohibited by architecture tests. |
| **Job processing** | Subtle shimmer/progress only; respect prefers-reduced-motion. | `TryOnProcessing` features an indeterminate progress bar with a soft linear gradient shimmer (`h-1`, loop duration: 1.8s–2.6s). When `prefers-reduced-motion` is active, the shimmer is suppressed into a calm, static progress indicator. |
| **Result ready** | Crossfade from processing skeleton to result after image decode. | `ResultViewer` pre-decodes the private authenticated blob (`img.decode()`) before crossfading from the loading skeleton to the revealed look (`duration: 0.28s`, easeOut). Under reduced motion, reveal is immediate with duration 0. |
| **Favorite toggle** | Short scale/opacity feedback without delaying mutation. | `FavoriteButton` triggers a micro-bounce (`motion.span`, duration: 0.22s, `scale: 0.8 -> 1`, `opacity: 0.7 -> 1`) keyed to `isFavorite`, while dispatching the TanStack Query `mutate()` synchronously with zero artificial delay. |

### 17.2 Reduced Motion Architecture

Accessibility and reduced motion compliance are foundational across every animated component:

- **Universal Detection**: Powered by `useReducedMotion()` from `motion/react` and `@/hooks/use-reduced-motion`.
- **Immediate Rendering**: Critical content (page navigation, modal dialogs, drawer sheets, upload previews, and try-on results) appears immediately when reduced motion is preferred (`duration: 0` or bypassing `motion.div` directly to render `<div className={className}>{children}</div>`).
- **Dialog & Sheet Overlays**: Modals and slide-out sheets in `@/components/ui/dialog` and `@/components/ui/sheet` specify `motion-reduce:duration-0 motion-reduce:animate-none motion-reduce:transition-none` to eliminate jarring scaling or translation animations.
- **Architectural Guardrails**: Verified by automated architecture tests (`tests/architecture/motion-system.test.ts`) that enforce static shell retention, canonical `motion/react` imports, zero particle libraries, decode-first result crossfading, and instantaneous favorite mutation.

## 18. Responsive Phone, Tablet and Desktop UX (Phase 19)

Phase 19 establishes an adaptive, editorial responsive design system tailored specifically for phone, tablet, and desktop viewports across all 6 core product surfaces in **V Try-On**.

### 18.1 Responsive UX Matrix

| Area | Phone (< 768px / < 640px) | Tablet (768px–1024px / md) | Desktop (>= 1024px / lg, xl) |
| :--- | :--- | :--- | :--- |
| **Navigation** | Bottom nav (`MobileTabBar`, h-16) + compact sticky top bar (`h-14`) | Adaptive rail / top bar (collapses to 48px icon rail with toggleable expansion) | Persistent compact rail (`defaultOpen={false}`) maximizing horizontal canvas |
| **Landing hero** | Single-column editorial stack (`flex flex-col text-center space-y-6`) | Image/text asymmetry (`md:grid md:grid-cols-12 md:text-left`) | Two-column cinematic composition (editorial text left, cinematic preview right) |
| **Outfits** | 2 columns (`grid-cols-2`) | 3–4 columns (`sm:grid-cols-3 md:grid-cols-4`) | 4–6 columns (`lg:grid-cols-5 xl:grid-cols-6`) |
| **Studio** | Sequential cards (linear stack: Person card → Outfit card → Action bar) | Adaptive split (`md:grid-cols-2 gap-6`) | Person/outfit workspace split (`lg:grid-cols-12` with 7/5 ratio) |
| **Result** | Full-width image, controls below (`flex-col`) | Wide image + metadata card (`max-w-3xl`) | Large comparison canvas (`lg:col-span-7 xl:col-span-8`) + side metadata (`lg:col-span-5 xl:col-span-4`) |
| **History** | Image cards / list (`grid-cols-1`) | Dense cards (`sm:grid-cols-2 md:grid-cols-3 gap-3.5`) | Grid/list hybrid with rich metadata (`lg:grid-cols-3 xl:grid-cols-4`, paired preview badge, resolution, timestamps) |

### 18.2 Architectural Responsive Highlights

1. **Navigation Shell Discipline**:
   - `SidebarProvider defaultOpen={false}` initializes the desktop and tablet workspaces in a compact 48px rail, giving generous width to garments, model photos, and try-on comparisons.
   - On phone screens (< 768px), navigation transitions completely to `<MobileTabBar>` anchored to the bottom edge with safe-area insets, paired with a compact `h-14` top bar.
2. **Hero Editorial & Cinematic Staging**:
   - On mobile, visitors receive a laser-focused single-column editorial stack.
   - On tablet, an asymmetrical balance between copy and atmospheric visual elements creates an editorial magazine layout.
   - On desktop, a cinematic two-column composition presents the copy on the left and a live try-on preview showcase card on the right.
3. **Outfits & Wardrobe Density**:
   - Smooth progression from 2 columns on phones to 3–4 columns on tablets and 4–6 columns on large displays preserves optimal 3:4 portrait card aspect ratios and readability.
4. **Studio Step Sequencing**:
   - On phones, users experience an intuitive 1-2-3 sequential journey (Choose photo -> Choose outfit -> Generate).
   - On tablets and desktops, selection panels expand side-by-side into an interactive composition workspace.
5. **Result Presentation**:
   - Mobile and tablet users enjoy full-width image fidelity with actions comfortably stacked underneath.
   - Desktop viewports unlock a wide comparison canvas with a sticky side metadata control center.
6. **History Hybrid Density**:
   - Phone cards emphasize large visual previews with quick deletion affordances.
   - Desktop cards reveal paired garment thumbnails, generation resolution badges (`width × height`), and detailed timestamps.


## 19. Accessibility, Performance and Security (Phase 20)

Phase 20 establishes deep accessibility compliance, resilient runtime performance optimizations, and rigorous frontend security boundaries across the entire **V Try-On** web application.

### 19.1 Accessibility (WCAG 2.1 AA Compliance)

| Area | Implementation Pattern | User & Assistive Semantics |
| :--- | :--- | :--- |
| **Keyboard Focus** | Visible high-contrast focus rings (`:focus-visible`) | Global 2px outline with 2px offset (`outline: 2px solid var(--ring); outline-offset: 2px;`) across interactive buttons, inputs, links, and cards. |
| **Route Focus Management** | Programmatic focus shift on route transition | `AppLayout` detects `location.pathname` changes and shifts keyboard focus cleanly to `<main id="main-content" tabIndex={-1}>` via `preventScroll: true`, orienting screen reader users without jarring scroll jumps. |
| **Contextual Imagery Alt Text** | Informative, contextual descriptions for all imagery | Uploaded portraits use `"Your selected person photo"`, result canvas uses `"Virtual try-on look fitted with {outfitName}"`, and garments use detailed names/descriptions. |
| **Dialogs & Overlays** | Base UI / Radix primitives with focus trapping | Modals (`Dialog`) and sliding drawers (`Sheet`) trap focus within the active container, restore focus upon close, and dismiss safely on `Escape`. |
| **Restrained Live Regions** | Single status transition announcements | `TryOnProcessing` utilizes `aria-live="polite"` with state tracking (`prevStatusRef !== job.status`), announcing transitions ("Waiting to start", "Creating your try-on") without spamming on repetitive polling intervals. |
| **Non-Color Status Indicators** | Multi-signal status indicators | Succeeded, failed, and queued states combine distinct iconography (`Checkmark`, `AlertCircle`, `Loading`), explicit text labels, and ARIA attributes (`aria-pressed`, `role="status"`, `role="alert"`). Color is never the sole indicator. |

### 19.2 Performance Optimizations

1. **Lazy-Loaded Route Bundles**:
   - All authenticated application surfaces (`StudioPage`, `OutfitsPage`, `FavoritesPage`, `UploadsPage`, `HistoryPage`, `TryOnDetailPage`, `SettingsPage`) and error pages are dynamically imported via `React.lazy()` within `router.tsx`.
   - Initial page loads only download core public marketing shell bundles, with route chunks fetched on-demand.
2. **Heavy Utility Code-Splitting**:
   - The interactive image comparison slider (`ImageCompare`), featuring touch listeners, pointer events, and divider math, is lazy-loaded with `React.lazy()` and wrapped in `<Suspense>` inside `ResultViewer`. Initial result view loads instantly without dragging compare dependencies into the critical bundle.
3. **Intentional TanStack Query Stale Times**:
   - Wardrobe catalog queries (`useOutfits`) specify `staleTime: 5 * 60 * 1000` (5 minutes) and `refetchOnWindowFocus: false`.
   - Garment detail queries (`useOutfit`) specify `staleTime: 10 * 60 * 1000` (10 minutes) and `refetchOnWindowFocus: false`.
   - Prevents needless background refetching and layout thrashing during standard window blur/focus actions.
4. **Preloaded & Decoded Result Reveal**:
   - `ResultViewer` loads the private authenticated blob into an off-screen `new Image()` and calls `img.decode()` before revealing the look.
   - Eliminates image decoding layout jank, allowing a smooth crossfade from the processing skeleton directly to the rendered garment look.
5. **Clean Server-Side Pagination**:
   - Wardrobe catalog and Generation History rely on server-side pagination (12–24 items per page) rather than heavy virtualization libraries, ensuring lightweight DOM trees and robust keyboard accessibility.
6. **Immutable CDN Caching & Content-Hashed Outputs**:
   - `vite.config.ts` enforces content-hashed filenames (`assets/[name]-[hash].js`, `assets/[name]-[hash].css`).
   - `public/_headers` configures static hosting directives:
     - `/assets/*`: `Cache-Control: public, max-age=31536000, immutable` (1-year immutable caching).
     - `/*.html`: `Cache-Control: public, max-age=0, must-revalidate` (instant cache invalidation for app shell).

### 19.3 Frontend Security Architecture

1. **Authoritative Backend Ownership**:
   - Client-side route guards (`RequireAuth`, `RequireGuest` in `guards.tsx`) provide UX redirection only.
   - Resource access and operations are strictly guarded by backend ownership checks and token validation; frontend never assumes authorization.
2. **Zero Raw Server HTML (XSS Prevention)**:
   - All server messages, validation error strings, toast notifications, and job statuses are treated strictly as plain text.
   - Zero occurrences of `dangerouslySetInnerHTML` exist in application features and pages.
3. **File Picker MIME Restriction**:
   - `PersonUploadDropzone` enforces `accept="image/jpeg,image/png,image/webp"` on the native file picker, while the backend maintains authoritative MIME and magic-byte validation.
4. **Strict Content Security Policy (CSP)**:
   - Configured in `index.html` and static hosting headers:
     `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https: http:; connect-src 'self' https: http: ws: wss:; frame-ancestors 'none'; object-src 'none'; base-uri 'self';`
   - Strictly prohibits embedding the application in external iframes (`frame-ancestors 'none'`) and forbids plugins (`object-src 'none'`).
5. **Zero Console & Logging Leakage**:
   - Zero `console.log`, `console.info`, or `console.error` statements exist in application code.
   - Access tokens, refresh tokens, passwords, private image URLs, and raw payloads are never logged to the browser console or third-party analytics.

## 20. Testing Strategy (Phase 21)

Phase 21 establishes a comprehensive, multi-layer testing strategy ensuring complete correctness, regression prevention, accessibility compliance, and visual stability across the **V Try-On** frontend.

### 20.1 Layer & Coverage Matrix

| Layer | Coverage & Target Scope | Key Test Suites |
| :--- | :--- | :--- |
| **Unit** | Formatters, validators, auth helpers, query-key builders, polling interval logic | `src/lib/utils/__tests__/format-date.test.ts`<br>`src/features/uploads/lib/__tests__/validate-person-image.test.ts`<br>`src/lib/auth/__tests__/token-store.test.ts`<br>`src/lib/auth/__tests__/safe-redirect.test.ts`<br>`src/test/query-keys.test.ts`<br>`src/features/try-on/hooks/__tests__/use-try-on-job.test.ts` |
| **Component** | Login/register forms, upload dropzone, outfit card, favorite mutation behavior, job states (`queued`, `processing`, `failed`), result viewer | `tests/auth/login.test.tsx`<br>`tests/auth/register.test.tsx`<br>`src/features/uploads/components/__tests__/person-upload-dropzone.test.tsx`<br>`src/features/outfits/components/__tests__/outfit-card.test.tsx`<br>`src/features/favorites/components/__tests__/favorite-button.test.tsx`<br>`src/features/try-on/components/__tests__/try-on-processing.test.tsx`<br>`src/features/try-on/components/__tests__/try-on-failure.test.tsx`<br>`src/features/try-on/components/__tests__/result-viewer.test.tsx` |
| **Integration** | Route guards, API error mapping, refresh coordinator, optimistic favorite rollback | `src/app/__tests__/guards.test.tsx`<br>`src/lib/api/__tests__/errors.test.ts`<br>`src/lib/api/__tests__/refresh-coordinator.test.ts`<br>`src/features/favorites/hooks/__tests__/use-toggle-favorite.test.tsx` |
| **E2E Journeys** | 1. `register/login -> upload -> select outfit -> generate -> wait/poll -> result -> history`<br>2. `favorite / unfavorite` with optimistic updates and rollback<br>3. `logout / session expiry` with `returnTo` preservation | `tests/e2e/try-on-journey.test.tsx`<br>`tests/e2e/favorite-lifecycle-journey.test.tsx`<br>`tests/e2e/session-lifecycle-journey.test.tsx` |
| **Visual & Responsive** | Responsive viewport assertions across Phone (375x667), Tablet (768x1024), and Desktop (1440x900) for navigation, landing hero, studio composition, and result viewer | `tests/visual/responsive-surfaces.test.tsx` |

### 20.2 21.1 Mocking & AI Model Isolation

- **Zero CatVTON Model Dependency**: Component, integration, and E2E frontend tests strictly **never** depend on a locally running CatVTON model, Python process, PyTorch environment, GPU server, or worker queue.
- **Explicit Canonical Fixtures** (`src/test/fixtures/try-on-fixtures.ts`):
  - `mockQueuedJob`: Job with status `"queued"` and zero generated artifacts.
  - `mockProcessingJob`: Job with status `"processing"` during active generation.
  - `mockSucceededJob`: Job with status `"succeeded"` with generated `result_image_url`, resolution metadata (`768x1024`), and timestamps.
  - `mockFailedJob`: Job with status `"failed"` with explicit error code (`TRYON_PROCESSING_FAILED`).
  - `mockInvalidInputJob`: Job with status `"failed"` with input validation error code (`INVALID_INPUT`).
  - `createMockTryOnJob()`: Typed factory for custom job overrides.
- **Canonical Request Interception** (`MockServer` in `src/test/mock-server.ts`):
  - Intercepts requests at the Axios transport adapter level (`apiClient.defaults.adapter`).
  - Supports dynamic progression through try-on job lifecycles (`setJobStatus("queued" | "processing" | "succeeded" | "failed")`).
  - Handles mock authenticated binary blob responses for private result media (`/api/v1/try-ons/{id}/content`) and upload content.
  - Provides deterministic error simulation via `failNext(status, code, message)`.

### 20.3 Architecture Enforcement

Automated architectural guardrails in `tests/architecture/testing-strategy.test.ts` enforce:
1. **Model Isolation**: Verifies that no test files spawn Python or connect to local inference ports.
2. **Explicit Fixtures**: Ensures all canonical try-on states exist as typed exports.
3. **Five-Layer Coverage**: Programmatically verifies the presence of Unit, Component, Integration, E2E, and Visual test suites.

## 21. Phase-wise Implementation Plan

| Phase | Deliverable | Acceptance Checkpoint |
| :--- | :--- | :--- |
| **0 - Foundation** | Vite TS project, lint/format, Tailwind, shadcn, Hugeicons, Motion, Router, Query | App boots cleanly; aliases/env validation work; CI scripts pass. |
| **1 - Design system** | Tokens, typography, buttons, image frame, loading/error/empty states, layout primitives | Core primitives work across phone/desktop and keyboard. |
| **2 - Routing shell** | PublicLayout, GuestOnlyRoute, RequireAuth, AppShell, 404/route error states | Direct URL navigation and redirects behave correctly. |
| **3 - Auth** | Register/login/logout, current-user bootstrap, token refresh coordination | Protected routes survive page refresh and expire cleanly. |
| **4 - Landing page** | Hero, how-it-works, showcase, features, privacy, CTA, footer | Premium responsive marketing page with no fake claims. |
| **5 - Uploads** | Person upload, validation, preview, upload library, delete | User can persist/select own person image. |
| **6 - Outfits** | Catalogue, detail, favorites and favorites page | Favorite state remains consistent across pages. |
| **7 - Studio** | Person + outfit selectors, generation CTA, POST /try-ons | 202 job is created once and transitions into tracked state. |
| **8 - Job/result** | Polling, status UI, result viewer, comparison and retry path | All terminal statuses stop polling and render truthfully. |
| **9 - History** | Paginated history, details, delete/cancel rules | History reflects backend state after generation and mutations. |
| **10 - Settings/legal** | Profile/account surface plus privacy/terms polish | Navigation and legal links complete. |
| **11 - Quality** | E2E, responsive QA, accessibility, performance, error/offline cases | No critical flow depends on happy-path assumptions. |
| **12 - Production** | Build/deploy config, CSP/headers, monitoring hooks, asset caching | Production build is reproducible and API base URL configurable. |

### 21.1 Recommended Implementation Sequence Inside Each Phase
1. Define API / type contract.
2. Create query / mutation service.
3. Build loading, empty, success, and error states before polishing.
4. Implement phone composition first, then tablet and desktop adaptations.
5. Apply motion only after the static interaction is correct and accessible.
6. Add tests for the state machine and regression-prone behavior.
7. Run production build and inspect network / runtime warnings before phase sign-off.

---

## 22. Deployment and Production Configuration

### 22.1 Vite Build Pipeline
```bash
npm run typecheck
npm run lint
npm run test
npm run build
```
- The `dist/` directory is the deployable static bundle.
- The frontend can be deployed independently from the FastAPI backend.
- Configure `VITE_API_BASE_URL` during build and ensure backend CORS accepts only the intended frontend origins.
- For same-domain deployment, reverse proxy `/api` to FastAPI at the edge to simplify cookies and CORS.

### 22.2 Environment Model
| Environment | Frontend | Backend |
| :--- | :--- | :--- |
| **Local** | `localhost` Vite dev server | `127.0.0.1` FastAPI + MySQL + local Redis / Celery |
| **Staging** | Staging static host / preview deploy | Staging API / DB / storage / worker |
| **Production** | CDN / static host (Cloudflare, Vercel, Netlify) | Production API + persistent storage + Redis + GPU workers |

---

## 23. Definition of Done

- **Landing page**: Responsive, accessible, and routes cleanly into registration / login.
- **Authentication**: Supports register, login, refresh, logout, and protected-route restoration.
- **Uploads**: Users can upload, view, select, and delete their person images.
- **Wardrobe**: Users can browse outfits and favorite/unfavorite with consistent cross-page cache state.
- **Studio**: Creates a virtual try-on job using selected person upload and outfit with double-submit protection.
- **Job lifecycle**: `queued`, `processing`, `succeeded`, and `failed` states are rendered from backend truth and polling terminates correctly.
- **Result page**: Provides high-quality image viewing, before/after comparison slider, and native authenticated download.
- **History**: Paginated, resilient, deep-linkable, and supports terminal job deletion.
- **Feedback states**: All screens have deliberate loading, empty, error, and offline unavailable states.
- **Responsive composition**: Phone, tablet, and desktop are deliberately composed; zero horizontal overflow.
- **Quality & Verification**: Full Vitest test suite passes (100%), linter reports 0 errors, and production build succeeds with clean TypeScript compilation.

---

## Appendix A — Route Configuration Reference

```tsx
const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", lazy: () => import("@/pages/public/landing") },
      { path: "/how-it-works", lazy: () => import("@/pages/public/how-it-works") },
      { path: "/privacy", lazy: () => import("@/pages/public/privacy") },
      { path: "/terms", lazy: () => import("@/pages/public/terms") },
    ],
  },
  {
    element: <GuestOnlyRoute />,
    children: [
      { path: "/login", lazy: () => import("@/pages/auth/login") },
      { path: "/register", lazy: () => import("@/pages/auth/register") },
    ],
  },
  {
    element: <RequireAuth />,
    children: [{
      path: "/app",
      element: <AppShell />,
      children: [
        { index: true, element: <Navigate to="studio" replace /> },
        { path: "studio", lazy: () => import("@/pages/app/studio") },
        { path: "uploads", lazy: () => import("@/pages/app/uploads") },
        { path: "outfits", lazy: () => import("@/pages/app/outfits") },
        { path: "favorites", lazy: () => import("@/pages/app/favorites") },
        { path: "history", lazy: () => import("@/pages/app/history") },
        { path: "try-ons/:jobId", lazy: () => import("@/pages/app/try-on-detail") },
        { path: "settings", lazy: () => import("@/pages/app/settings") },
      ],
    }],
  },
  { path: "*", lazy: () => import("@/pages/errors/not-found") },
]);
```

---

## Appendix B — Core Type Reference

```ts
type User = { id: string; name: string; email: string; created_at: string };

type PersonUpload = {
  id: string; image_url: string; width?: number; height?: number; created_at: string;
};

type Outfit = {
  id: string; name: string; category?: string; image_url: string; is_favorite?: boolean;
};

type TryOnStatus = "queued" | "processing" | "succeeded" | "failed" | "cancelled";

type TryOnJob = {
  id: string; status: TryOnStatus; progress?: number | null;
  person_upload?: PersonUpload; outfit?: Outfit;
  result?: { id: string; image_url: string } | null;
  error?: { code?: string; message: string } | null;
  created_at: string; updated_at: string;
};
```

---

## Appendix C — Component Inventory

| Domain | Components |
| :--- | :--- |
| **Brand** | `BrandMark`, `Wordmark`, `BrandLink` |
| **Marketing** | `MarketingHeader`, `HeroTryOnVisual`, `HowItWorks`, `ShowcaseRail`, `FeatureStory`, `PrivacyCallout`, `FinalCTA`, `MarketingFooter` |
| **Auth** | `AuthCard`, `LoginForm`, `RegisterForm`, `PasswordField`, `SessionNotice` |
| **Navigation** | `AppSidebar`, `MobileBottomNav`, `AppTopbar`, `UserMenu`, `BreadcrumbBack` |
| **Uploads** | `PersonUploader`, `UploadDropzone`, `PersonPreview`, `UploadGrid`, `UploadCard`, `DeleteUploadDialog` |
| **Outfits** | `OutfitGrid`, `OutfitCard`, `OutfitFilters`, `OutfitDetail`, `FavoriteButton` |
| **Studio** | `TryOnComposer`, `PersonSelector`, `OutfitSelector`, `GenerateBar`, `JobProgress` |
| **Result** | `ResultViewer`, `ImageCompare`, `ResultMeta`, `ResultActions` |
| **History** | `HistoryList`, `HistoryCard`, `HistoryFilters`, `StatusBadge` |
| **Feedback** | `PageSkeleton`, `ImageSkeleton`, `EmptyState`, `ErrorState`, `OfflineBanner`, `RetryButton` |

---

## Appendix D — AI Agent Build Prompt Template

```text
ROLE
Act as a senior React/TypeScript frontend engineer and product UI engineer.

STACK
React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Hugeicons + Motion for React + React Router + TanStack Query + React Hook Form + Zod.

CONSTRAINTS
- Preserve the existing backend API contract under /api/v1.
- Use Hugeicons consistently.
- Use shadcn as accessible primitives, but produce a custom premium fashion UI.
- Build truthful loading/empty/error/offline states; no dummy production data.
- Phone, tablet and desktop must have responsive compositions.
- Respect prefers-reduced-motion.
- Do not put API calls directly in presentational components.

TASK
Implement Phase <N>: <phase name>. Inspect the repository first, reuse existing primitives, then implement types, API/query layer, UI states, route integration and tests.

DONE WHEN
Typecheck, lint and tests pass; route works by direct URL; loading/error/empty/success states are covered; responsive and keyboard behavior is verified.
```

---

## Final Recommended Frontend Architecture

Build the product around `/app/studio` as the primary authenticated destination. Use TanStack Query as the source of truth for backend data, a centralized refresh-aware API client, nested React Router layouts, feature-based modules, and a premium image-first shadcn/Hugeicons/Motion design system. Keep CatVTON asynchronous details behind simple job states so the web experience remains clean even as the backend later scales to multiple API and GPU workers.
