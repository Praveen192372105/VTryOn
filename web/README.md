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
├── components/           # Truly shared UI, brand, feedback, image, and navigation primitives
│   ├── brand/            # Brand Logo and Monogram marks
│   ├── feedback/         # Domain-neutral states: EmptyState, ErrorPanel, LoadingShell
│   ├── image/            # Generic image components: ImageFrame
│   ├── navigation/       # AppNavbar, MobileTabBar
│   └── ui/               # Base UI / shadcn design primitives
├── config/               # Static configuration (env validation, app-config, typed navigation)
├── features/             # Self-contained business feature modules
│   ├── account/          # Account profile & settings presentation
│   ├── auth/             # Session state machine, login/register API, schemas, useAuth hook
│   ├── favorites/        # Wardrobe favorites API, hooks, query keys
│   ├── history/          # Try-on history grid & presentation
│   ├── outfits/          # Garment catalogue API, hooks, query keys, category browsing
│   ├── try-on/           # Core fitting domain: composer, status, result viewer, polling hook, mutation
│   └── uploads/          # Portrait manager API, hooks, mutation, query keys
├── hooks/                # Truly cross-feature React hooks (useMediaQuery, useReducedMotion, useDocumentTitle)
├── lib/                  # Framework-agnostic infrastructure
│   ├── api/              # Central typed Axios client, errors, refresh coordinator, request-id
│   ├── auth/             # Token store abstraction (in-memory + localStorage cache)
│   └── utils.ts          # Generic Tailwind class merging helper (cn)
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
└── architecture/         # Automated architecture invariant tests
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

## 5. Environment Variables

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
