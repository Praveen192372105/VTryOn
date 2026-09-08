package com.example.vtryon.domain.model

/**
 * Garment categories matching CatVTON and backend contracts.
 */
enum class OutfitCategory(val apiValue: String, val displayName: String) {
    UPPER_BODY("upper_body", "Tops & Jackets"),
    LOWER_BODY("lower_body", "Pants & Skirts"),
    DRESSES("dresses", "Dresses");

    companion object {
        fun fromApiValue(value: String?): OutfitCategory {
            return entries.firstOrNull { it.apiValue.equals(value, ignoreCase = true) }
                ?: UPPER_BODY
        }
    }
}
