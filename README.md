# V Try-On — AI Virtual Fitting Room

[![Frontend Tests](https://img.shields.io/badge/frontend%20tests-102%20passed-brightgreen.svg)]()
[![Backend Tests](https://img.shields.io/badge/backend%20tests-226%20passed-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue.svg)]()
[![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)]()
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)]()

Production-grade, privacy-first virtual fitting room application. V Try-On enables users to upload silhouette portraits, browse curated garments, and generate realistic garment draping, texture synthesis, and contour matching via diffusion-based virtual try-on pipelines.

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    V Try-On Web Client                      │
│      React 19 + TypeScript + Vite + Tailwind CSS v4        │
│   (Content-First Landing, Studio, Favorites, History, Auth) │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST API (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend Replicas                 │
│      SQLAlchemy 2.0 + Pydantic v2 + JWT Authentication      │
│  (Auth, Uploads, Outfits, Try-On Requests, Storage Manager) │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
      SQL / DB Queries                Job Enqueue / Events
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      MySQL / MariaDB         │ │        Redis Broker        │
│    (Primary Relational)      │ │   (Queues, Locks, State)   │
└──────────────────────────────┘ └─────────────┬──────────────┘
                                               │
                                       Worker Dequeue (gpu)
                                               ▼
                                 ┌────────────────────────────┐
                                 │    Celery GPU Workers      │
                                 │   CatVTON Diffusion Pipeline│
                                 │  (Model Masker + Inpainting)│
                                 └────────────────────────────┘
```

---

## 📁 Repository Structure

```text
VTryOn/
├── backend/                       # Python FastAPI + Celery + CatVTON backend
│   ├── app/                       # Core application source
│   │   ├── ai/                    # CatVTON model lifecycle & worker adapter
│   │   ├── api/                   # Versioned REST endpoints (v1)
│   │   ├── core/                  # Configuration, security, error hierarchy
│   │   ├── db/                    # SQLAlchemy models & Alembic migrations
│   │   ├── repositories/          # Pure persistence layer
│   │   ├── schemas/               # Typed Pydantic request/response schemas
│   │   ├── services/              # Domain logic & unit-of-work transactions
│   │   ├── storage/               # Media & storage drivers (Local + S3)
│   │   └── workers/               # Celery app, tasks & dispatchers
│   ├── CatVTON/                   # Upstream CatVTON diffusion implementation
│   ├── scripts/                   # Seeding, smoke tests & admin scripts
│   ├── storage/                   # Local file storage (uploads, results)
│   ├── tests/                     # 226 unit, service, api & security tests
│   ├── Dockerfile.api             # Production container for API replicas
│   ├── Dockerfile.worker          # Production container for GPU inference
│   ├── requirements.txt           # Core backend production dependencies
│   ├── requirements-worker.txt    # PyTorch, CUDA & Diffusion worker dependencies
│   └── requirements-dev.txt       # Pytest, ruff & type checker dependencies
│
└── web/                           # Modern React 19 + TypeScript frontend
    ├── src/
    │   ├── app/                   # App root, router, providers & guards
    │   ├── components/            # Design system, brand logo, feedback & UI
    │   ├── features/              # Feature modules: auth, landing, studio, try-on, history
    │   ├── lib/                   # API client, token store & utilities
    │   └── styles/                # CSS design tokens & theme-aware scrollbars
    ├── tests/                     # Vitest test suites (102 tests passing)
    ├── package.json               # Frontend dependencies & scripts
    └── vite.config.ts             # Vite bundler configuration
```

---

## 🚀 Quickstart & Setup

### Prerequisites
- **Node.js**: `20.x` or `22.x`
- **Python**: `3.10` or higher
- **MySQL / MariaDB**: e.g., XAMPP, Homebrew, or Docker
- **Redis**: For task queuing and session caching

---

### 1. Backend Setup

```bash
cd backend

# 1. Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# 2. Install production dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# 3. Environment configuration
cp .env.example .env
# Edit .env with your MySQL, Redis, and JWT secrets

# 4. Run database migrations
alembic upgrade head

# 5. Start development API server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd web

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start development server
npm run dev
```

The application will be live at `http://localhost:5173/`.

---

## 🧪 Testing & Verification

### Backend Test Suite (Pytest)
```bash
cd backend
pytest -m "not gpu and not slow"
# 226 passed unit, service, api, and architectural invariant tests
```

### Frontend Test Suite (Vitest)
```bash
cd web
npm test
# 102 passed unit, integration, and architecture tests across 15 suites
```

### Production Bundling
```bash
cd web
npm run build
# Compiles optimized production distribution via Vite
```

---

## 🔒 Architectural & Security Invariants

1. **Monochrome Editorial Design**: Tailored tokens with zero harsh saturated tones, theme-aware floating scrollbars, and accessible SVG icon systems.
2. **Account Isolation**: Multi-tenant database schema enforced at repository queries; images and generated try-ons remain strictly scoped to authenticated user IDs.
3. **Stateless API Replicas**: API pods do not require CUDA hardware; heavy generative inference is strictly offloaded to dedicated Celery GPU workers.
4. **Resilient Token Management**: In-memory access token storage with automatic silent token refresh via HTTP-only secure refresh cookies.

---

## 📄 License

Private & Proprietary. All rights reserved.
