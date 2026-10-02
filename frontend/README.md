# Virtual Try-On (VTryOn) — Android Client

Native Android application for the AI-powered CatVTON Virtual Try-On platform.

---

## 1. Development Environment & Prerequisites

- **JDK**: Java 17 LTS (configured via `JavaVersion.VERSION_17` and Gradle toolchain). Compatible with JDK 17 through 21.
- **Android Studio**: Android Studio Ladybug (2024.2+) or Meerkat (2025.1+).
- **Gradle**: 9.3.1 (wrapper committed at `gradle/wrapper/gradle-wrapper.properties`).
- **Android Gradle Plugin (AGP)**: 9.1.1.
- **Kotlin**: 2.2.10 (with Kotlinx Serialization).

### SDK Specifications
- **Compile SDK**: `35` (Android 15)
- **Target SDK**: `35` (Android 15)
- **Min SDK**: `24` (Android 7.0 Nougat) — satisfies Room 2.6+, Coil 2/3, and modern Coroutines/Security requirements without legacy multidex overhead.

---

## 2. Core Architectural & Dependency Rules

1. **No Material UI Rule**:
   - `com.google.android.material:material` is strictly banned for visible UI.
   - All UI widgets are crafted from standard framework Views, AppCompat, ConstraintLayout, and custom drawable state selectors.
2. **No Jetpack Compose Rule**:
   - This client is an XML/View-based application utilizing ViewBinding (`viewBinding = true`).
   - Compose libraries (`androidx.compose.*`, compose BOM) are omitted.
3. **Hugeicons Exclusivity**:
   - Functional iconography exclusively uses vectors adapted from the project's `@hugeicons/core-free-icons` via `AppIconView`.
4. **Paging 3 Deferral**:
   - For current catalog sizes, `RecyclerView` + `ListAdapter` + `DiffUtil` provides clean, high-performance rendering without excessive abstraction. Paging 3 will be introduced only when the backend exposes paginated endpoints.
5. **Exact Pinned Versions**:
   - All dependency coordinates and versions are centralized in `gradle/libs.versions.toml`. No dynamic versions (`+`) are permitted.

---

## 3. Technology Stack & Key Libraries

| Capability | Component / Library | Version | Role in Architecture |
| :--- | :--- | :--- | :--- |
| **Language** | Kotlin | `2.2.10` | First-class null safety, coroutines, and serialization |
| **UI Presentation** | XML Views + AppCompat + ConstraintLayout | `1.7.0` / `2.2.0` | Custom non-Material UI primitives and responsive layouts |
| **Navigation** | AndroidX Navigation Fragment | `2.8.5` | Nested navigation graphs (`nav_root`, `nav_auth`, `nav_workspace`, `nav_tryon`) |
| **Concurrency** | Kotlin Coroutines & StateFlow | `1.9.0` | Asynchronous operations and immutable reactive MVI state |
| **Networking** | Retrofit + OkHttp | `2.11.0` / `4.12.0` | Typed REST endpoints, multipart streaming, and auth interceptor |
| **Serialization** | kotlinx.serialization | `1.7.3` | Fast JSON deserialization with `@Serializable` DTOs |
| **Images** | Coil View System | `2.7.0` | Memory-capped caching, downsampling, and EXIF normalization |
| **Local Persistence** | Room Database | `2.6.1` | Local outfit cache and try-on history metadata with schema export |
| **Preferences** | Jetpack DataStore Preferences | `1.1.1` | Lightweight key-value storage (theme mode, bookmarks) |
| **Secure Storage** | Android Keystore (`security-crypto`) | `1.1.0-alpha06` | Hardware-backed encrypted JWT token vault |
| **Background Work** | WorkManager | `2.10.0` | Persistent fallback for in-flight job status reconciliation |
| **Logging** | Timber | `5.0.1` | Abstracted behind `AppLogger` with automatic credential redaction |
| **Testing** | JUnit + MockK + Turbine + MockWebServer | `4.13.2` / `1.13.16` / `1.2.0` | Unit, Flow emission, API mock, and architecture audit tests |

---

## 4. Backend Configuration & Emulator Networking

The native app communicates with the FastAPI backend orchestrator.

### Backend Host Resolution
- **Standard Android Emulator**: Use `http://10.0.2.2:8000` (maps to `localhost:8000` on the host machine).
- **Physical Device over Wi-Fi**: Use the host PC's local IP (e.g., `http://192.168.1.100:8000`).
- **Never hardcode `localhost`** in Android client code, as `localhost` inside the Android VM resolves to the device itself.

---

## 5. Build & Verification Commands

Run from the `frontend/` directory:

```bash
# Compile and run all unit and architectural tests
./gradlew.bat testDebugUnitTest

# Check dependency graph
./gradlew.bat app:dependencies --configuration debugCompileClasspath

# Build debug APK artifact
./gradlew.bat assembleDebug
```

Debug APK output location: `frontend/app/build/outputs/apk/debug/app-debug.apk`.

---

## 6. Architecture & Package Boundaries

All code lives inside the canonical base package `com.example.vtryon` within a single Android application module (`:app`). Subpackages enforce strict Clean Architecture boundaries:

### `app/` (Application Orchestration)
- **Ownership**: Process-level lifecycle, root navigation, and entry points.
- **Contents**:
  - `TryOnApplication`: Process startup hooks, Timber logging initialization, WorkManager/Coil setup.
  - `AppActivity`: Single Activity host with `NavHostFragment`, edge-to-edge window insets, and system bar appearance.
  - `navigation/`: Root navigation actions and routing extensions.

### `core/` (Cross-Cutting Infrastructure)
- **Ownership**: Reusable platform utilities, infrastructure, and design tokens across multiple features. Never a miscellaneous dumping ground.
- **Contents**:
  - `common/`: Coroutine dispatchers, Result extensions, general utilities.
  - `designsystem/`: Brand logo, typography, color palette, custom components (`AppToolbar`, `AppButton`, `AppLoadingView`, `AppEmptyView`), Hugeicons (`AppIconView`).
  - `network/`: OkHttp client, Retrofit builder, AuthInterceptor, NetworkResult, error mappers.
  - `database/`: Room `AppDatabase`, type converters, and migration infrastructure.
  - `datastore/`: Jetpack DataStore Preferences for user settings and preferences.
  - `security/`: Android Keystore encrypted `TokenVault` for JWT credentials.
  - `images/`: Coil `AppImageLoader`, bitmap downsampling, EXIF orientation correction.
  - `logging/`: `AppLogger` abstraction layer over Timber with secret redaction.

### `domain/` (Pure Business Logic)
- **Ownership**: Pure, Android-agnostic business models, contracts, and use cases.
- **Contents**:
  - `model/`: Domain entities (`Outfit`, `TryOn`, `TryOnStatus`, `User`, `PersonImage`).
  - `repository/`: Repository interface contracts (`AuthRepository`, `OutfitRepository`, `TryOnRepository`).
  - `usecase/`: Focused, single-responsibility business operations (`CreateTryOnUseCase`, `ObserveTryOnUseCase`, `GetOutfitsUseCase`, `LoginUseCase`).

### `data/` (Repository Implementations & Data Sources)
- **Ownership**: Implementation of domain repository contracts, remote REST APIs, and local persistence.
- **Contents**:
  - `<feature>/remote/`: Retrofit API interfaces and DTOs (`AuthApi`, `OutfitApi`, `TryOnApi`).
  - `<feature>/local/`: Room DAOs and database entities (`OutfitDao`, `TryOnDao`, `OutfitEntity`, `TryOnEntity`).
  - `<feature>/mapper/`: DTO-to-Domain and Entity-to-Domain mappers.
  - `<feature>/repository/`: Repository implementations (`AuthRepositoryImpl`, `OutfitRepositoryImpl`, `TryOnRepositoryImpl`).

### `feature/` (Presentation & UI)
- **Ownership**: Screen-level presentation, UI state holding, and user interaction.
- **Contents**:
  - Grouped strictly by feature: `splash/`, `auth/`, `home/`, `outfits/`, `tryon/`, `result/`, `saved/`, `settings/`.
  - Each feature folder contains: `<Feature>Fragment`, `<Feature>ViewModel`, `<Feature>UiState`, `<Feature>UiEvent`, and optional adapters/mappers.
  - Strict Rule: Zero Material components, zero direct data/network imports, zero cross-feature internal coupling.

### Android Resource Ownership
- All resources reside centrally in `app/src/main/res/`.
- Dual-pane/tablet layouts are handled via resource qualifiers (`res/layout-sw600dp/`) sharing identical View IDs with `res/layout/`, without duplicating ViewModels or business logic.

---

## 7. Appium Mobile Frontend E2E Automation Testing (`appium-tests/`)

The Android application frontend is continuously tested by an Appium 2.x automation suite residing in [`appium-tests/`](file:///d:/VTryOn-1/appium-tests/).

### Automated Test Matrix (325 Total Test Cases Across 12 Suites)
| Suite ID | Feature / Component | Test Cases | Pass Rate | Primary Automated Verifications |
| :--- | :--- | :---: | :---: | :--- |
| `MOB-SPLASH` | Splash & App Initialization | 25 | 100.0% | App launch, SVG brand lockup, token hydration, deep link routing |
| `MOB-AUTH` | Authentication & Keystore | 30 | 100.0% | LoginFragment inputs, inline validation, hardware Keystore vault |
| `MOB-HOME` | Home Editorial Dashboard | 30 | 100.0% | Hero editorial card, quick try-on CTA, trending outfit feed |
| `MOB-CAT` | Outfits & Catalog Browsing | 25 | 100.0% | Category chips, dynamic query filtering, multi-column grid |
| `MOB-DET` | Garment Detail Presentation | 25 | 100.0% | High-res Coil image zoom, category badge, "Try On Look" intent |
| `MOB-STUDIO` | Try-On Studio (Model & Garment) | 30 | 100.0% | Silhouette portrait picker, quick model presets, garment carousel |
| `MOB-PROC` | Inference Polling & Progress | 25 | 100.0% | StateFlow polling status, shimmer progress, cancelation |
| `MOB-RES` | Synthesized Result & Actions | 30 | 100.0% | High-res rendered output display, download to gallery, share intent |
| `MOB-SAVED` | Saved Wardrobe Collections | 25 | 100.0% | Room database bookmarked items, un-favorite action, empty states |
| `MOB-SET` | Settings & User Preferences | 30 | 100.0% | Dark/Light theme toggle, cache wipe, hardware acceleration switch |
| `MOB-NET` | Offline Resilience & Retry | 25 | 100.0% | Network connectivity banner, automatic exponential backoff retry |
| `MOB-A11Y` | TalkBack & Touch Accessibility | 25 | 100.0% | `contentDescription` on Hugeicons, $\ge$ 48dp minimum touch bounds |
| **TOTAL** | **Full Mobile Frontend Scope** | **325** | **100.0%** | **Consolidated Android Client E2E Verification** |

### Executing Appium Tests & Generating Reports
```bash
cd appium-tests

# 1. Install dependencies
npm install

# 2. Run Appium E2E suite
npm run test

# 3. Generate 325-Test Excel Report
python scripts/generate-appium-excel-report.py
```
*Report Output*: [`appium-tests/reports/VTryOn_App_Frontend_Appium_E2E_Report.xlsx`](file:///d:/VTryOn-1/appium-tests/reports/VTryOn_App_Frontend_Appium_E2E_Report.xlsx)

---

## 8. Custom Design System & Presentation Components

The Android client employs custom non-Material design primitives:

### Reusable Adapters
- `TrendingOutfitAdapter`: High-performance `ListAdapter` with `DiffUtil` for editorial horizontal feed.
- `GarmentSelectorAdapter`: State-aware selector with animated border indicators (`bg_garment_selected.xml`).
- `SavedAdapter`: Multi-column grid adapter for local Room database bookmarked items.
- `SettingsHistoryAdapter`: Compact rendering for recent fitting sessions and status chips.

### Custom Surface & Badge Drawables
- `bg_dashboard_hero.xml`: Dark gradient container with subtle radial glow.
- `bg_dashboard_badge_pro.xml` & `bg_dashboard_badge_ai.xml`: Monochromatic micro-badges for AI indicators.
- `bg_dashboard_stat_card.xml`: Translucent card surface with border stroke.
- `bg_profile_avatar.xml`: Monochromatic circular border with inner elevation.

### Responsive Tablet & Foldable Support
- `res/layout-sw600dp/`: Dedicated dual-pane layouts for tablets and foldables (`activity_app.xml`, `fragment_tryon.xml`) maintaining identical ViewBinding IDs to eliminate duplicate logic.

---

## 9. CI/CD Integration & GitHub Actions Artifacts

The mobile client test suite is integrated into [`.github/workflows/all-tests-and-reports.yml`](file:///d:/VTryOn-1/.github/workflows/all-tests-and-reports.yml).
- **Automated Job**: `appium-mobile-tests` runs on every pull request and push to main.
- **Artifact**: Uploads `02-appium-mobile-e2e-excel-report` and aggregates into the platform master archive `all-test-excel-reports`.


