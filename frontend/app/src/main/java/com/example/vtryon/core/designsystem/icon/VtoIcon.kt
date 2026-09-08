package com.example.vtryon.core.designsystem.icon

import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import com.example.vtryon.R

/**
 * Strongly-typed semantic iconography contract for the Virtual Try-On application.
 * All standard product actions must consume these semantic tokens rather than referencing
 * raw drawables directly. Sourced exclusively from official Hugeicons.
 */
sealed class VtoIcon(
    @get:DrawableRes val drawableRes: Int,
    @get:StringRes val defaultContentDescriptionRes: Int? = null
) {
    // Navigation
    data object Back : VtoIcon(R.drawable.vto_huge_arrow_left_02, R.string.a11y_go_back)
    data object Forward : VtoIcon(R.drawable.vto_huge_arrow_right_02, R.string.a11y_forward)
    data object Close : VtoIcon(R.drawable.vto_huge_cancel_01, R.string.a11y_close)
    data object Home : VtoIcon(R.drawable.vto_huge_home_01, R.string.a11y_home)
    data object TryOn : VtoIcon(R.drawable.vto_huge_sparkles, R.string.a11y_try_on)
    data object Saved : VtoIcon(R.drawable.vto_huge_bookmark_01, R.string.a11y_saved_looks)
    data object Settings : VtoIcon(R.drawable.vto_huge_settings_01, R.string.a11y_settings)

    // Authentication & Profile
    data object User : VtoIcon(R.drawable.vto_huge_user, R.string.a11y_profile)
    data object Lock : VtoIcon(R.drawable.vto_huge_lock)
    data object ShowPassword : VtoIcon(R.drawable.vto_huge_view, R.string.a11y_show_password)
    data object HidePassword : VtoIcon(R.drawable.vto_huge_view_off_slash, R.string.a11y_hide_password)
    data object Logout : VtoIcon(R.drawable.vto_huge_logout_01, R.string.a11y_logout)

    // Media & Photos
    data object Upload : VtoIcon(R.drawable.vto_huge_upload_04, R.string.a11y_upload_photo)
    data object Gallery : VtoIcon(R.drawable.vto_huge_image_02, R.string.a11y_open_gallery)
    data object Image : VtoIcon(R.drawable.vto_huge_image_01)
    data object Camera : VtoIcon(R.drawable.vto_huge_camera_01, R.string.a11y_take_photo)
    data object Delete : VtoIcon(R.drawable.vto_huge_delete_02, R.string.a11y_delete_item)
    data object Refresh : VtoIcon(R.drawable.vto_huge_refresh_01, R.string.a11y_refresh)
    data object Fullscreen : VtoIcon(R.drawable.vto_huge_full_screen, R.string.a11y_fullscreen)

    // Outfits & Catalog
    data object Favorite : VtoIcon(R.drawable.vto_huge_favourite, R.string.a11y_favorite)
    data object Search : VtoIcon(R.drawable.vto_huge_search_01, R.string.a11y_search)
    data object ClearSearch : VtoIcon(R.drawable.vto_huge_cancel_01, R.string.a11y_clear_search)
    data object Filter : VtoIcon(R.drawable.vto_huge_filter, R.string.a11y_filter_outfits)
    data object Grid : VtoIcon(R.drawable.vto_huge_grid_view, R.string.a11y_grid_view)
    data object List : VtoIcon(R.drawable.vto_huge_list_view, R.string.a11y_list_view)
    data object Garment : VtoIcon(R.drawable.vto_huge_shirt_01)

    // Try-On & Results
    data object Generate : VtoIcon(R.drawable.vto_huge_sparkles, R.string.a11y_try_on)
    data object Compare : VtoIcon(R.drawable.vto_huge_versus, R.string.a11y_compare_before_after)
    data object Save : VtoIcon(R.drawable.vto_huge_download_04, R.string.a11y_download_result)
    data object Share : VtoIcon(R.drawable.vto_huge_share_08, R.string.a11y_share_result)
    data object Download : VtoIcon(R.drawable.vto_huge_download_04, R.string.a11y_download_result)

    // Feedback & Status
    data object Check : VtoIcon(R.drawable.vto_huge_tick_02)
    data object Success : VtoIcon(R.drawable.vto_huge_checkmark_circle_02, R.string.a11y_status_success)
    data object Warning : VtoIcon(R.drawable.vto_huge_alert_circle, R.string.a11y_status_warning)
    data object Error : VtoIcon(R.drawable.vto_huge_cancel_circle, R.string.a11y_status_error)
    data object Offline : VtoIcon(R.drawable.vto_huge_wifi_off_01, R.string.a11y_status_offline)
    data object Info : VtoIcon(R.drawable.vto_huge_information_circle, R.string.a11y_status_info)

    /**
     * Custom adapter for legacy or dynamically provided drawables.
     */
    class Custom(
        @DrawableRes drawableRes: Int,
        @StringRes defaultContentDescriptionRes: Int? = null
    ) : VtoIcon(drawableRes, defaultContentDescriptionRes)
}
