package com.example.vtryon.core.designsystem.brand

/**
 * Official V Try-On brand logo geometry and vector paths.
 *
 * Sourced directly from web component `web/src/components/brand/LogoMark.tsx`.
 * Preserves the exact mathematical coordinates on a 64x64 viewBox without
 * any manual redrawing, rounding, or approximation.
 */
object AppLogoConstants {
    const val VIEWPORT_WIDTH: Float = 64f
    const val VIEWPORT_HEIGHT: Float = 64f
    const val DEFAULT_SIZE_DP: Int = 32

    /**
     * Canonical 5 fold facet paths representing the tailored digital garment.
     */
    val LOGO_PATHS: List<String> = listOf(
        // Upper-left tailored lapel / shoulder fold
        "M 16 14 C 20 11 25 11 29 13.5 C 29.8 14 30.2 14.8 30 15.7 L 27.5 28 C 27.2 29 26.2 29.7 25.1 29.5 L 14.5 27.8 C 13.5 27.6 12.8 26.6 13.1 25.5 L 14.5 17.5 C 14.7 16 15.3 14.7 16 14 Z",
        // Upper-right tailored lapel / shoulder fold (mirrored)
        "M 48 14 C 44 11 39 11 35 13.5 C 34.2 14 33.8 14.8 34 15.7 L 36.5 28 C 36.8 29 37.8 29.7 38.9 29.5 L 49.5 27.8 C 50.5 27.6 51.2 26.6 50.9 25.5 L 49.5 17.5 C 49.3 16 48.7 14.7 48 14 Z",
        // Mid-left waist / drape facet
        "M 12 31 C 11.5 31.8 11.8 32.8 12.5 33.4 L 20.5 40.5 C 21.3 41.2 22.5 41.3 23.4 40.7 L 29.5 36.5 C 30.5 35.8 30.8 34.5 30.2 33.5 L 26.5 27.2 C 26 26.3 24.8 26 23.9 26.4 L 13.5 30 C 12.8 30.2 12.3 30.5 12 31 Z",
        // Mid-right waist / drape facet (mirrored)
        "M 52 31 C 52.5 31.8 52.2 32.8 51.5 33.4 L 43.5 40.5 C 42.7 41.2 41.5 41.3 40.6 40.7 L 34.5 36.5 C 33.5 35.8 33.2 34.5 33.8 33.5 L 37.5 27.2 C 38 26.3 39.2 26 40.1 26.4 L 50.5 30 C 51.2 30.2 51.7 30.5 52 31 Z",
        // Lower center garment apex
        "M 24 43.5 C 23.2 44.2 23.3 45.4 24.1 46.1 L 30.2 52.5 C 31.2 53.5 32.8 53.5 33.8 52.5 L 39.9 46.1 C 40.7 45.4 40.8 44.2 40 43.5 L 33.5 38.5 C 32.6 37.8 31.4 37.8 30.5 38.5 Z"
    )
}
