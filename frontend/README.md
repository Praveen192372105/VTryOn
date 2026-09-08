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

