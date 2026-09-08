package com.example.vtryon.core.designsystem.icon

import androidx.annotation.DrawableRes
import com.example.vtryon.R

/**
 * Centralized registry of official Hugeicons vector resources.
 * Feature layers should interact with [VtoIcon] tokens.
 * This registry connects semantic tokens with their underlying Android VectorDrawables.
 */
object VtoIcons {
    // Navigation
    @get:DrawableRes val ArrowBack = R.drawable.vto_huge_arrow_left_02
    @get:DrawableRes val ArrowForward = R.drawable.vto_huge_arrow_right_02
    @get:DrawableRes val Close = R.drawable.vto_huge_cancel_01
    @get:DrawableRes val Home = R.drawable.vto_huge_home_01
    @get:DrawableRes val Sparkles = R.drawable.vto_huge_sparkles
    @get:DrawableRes val Bookmark = R.drawable.vto_huge_bookmark_01
    @get:DrawableRes val Settings = R.drawable.vto_huge_settings_01

    // Auth & User
    @get:DrawableRes val User = R.drawable.vto_huge_user
    @get:DrawableRes val Lock = R.drawable.vto_huge_lock
    @get:DrawableRes val Eye = R.drawable.vto_huge_view
    @get:DrawableRes val EyeOff = R.drawable.vto_huge_view_off_slash
    @get:DrawableRes val Logout = R.drawable.vto_huge_logout_01

    // Media & Photos
    @get:DrawableRes val Upload = R.drawable.vto_huge_upload_04
    @get:DrawableRes val Gallery = R.drawable.vto_huge_image_02
    @get:DrawableRes val Image = R.drawable.vto_huge_image_01
    @get:DrawableRes val Camera = R.drawable.vto_huge_camera_01
    @get:DrawableRes val Trash = R.drawable.vto_huge_delete_02
    @get:DrawableRes val Refresh = R.drawable.vto_huge_refresh_01
    @get:DrawableRes val Fullscreen = R.drawable.vto_huge_full_screen

    // Outfits & Catalog
    @get:DrawableRes val Heart = R.drawable.vto_huge_favourite
    @get:DrawableRes val HeartFilled = R.drawable.vto_huge_favourite
    @get:DrawableRes val Search = R.drawable.vto_huge_search_01
    @get:DrawableRes val Filter = R.drawable.vto_huge_filter
    @get:DrawableRes val Grid = R.drawable.vto_huge_grid_view
    @get:DrawableRes val List = R.drawable.vto_huge_list_view
    @get:DrawableRes val Shirt = R.drawable.vto_huge_shirt_01

    // Try-On & Results
    @get:DrawableRes val Versus = R.drawable.vto_huge_versus
    @get:DrawableRes val Download = R.drawable.vto_huge_download_04
    @get:DrawableRes val Share = R.drawable.vto_huge_share_08

    // Status & Feedback
    @get:DrawableRes val Check = R.drawable.vto_huge_tick_02
    @get:DrawableRes val CheckCircle = R.drawable.vto_huge_checkmark_circle_02
    @get:DrawableRes val Alert = R.drawable.vto_huge_alert_circle
    @get:DrawableRes val Error = R.drawable.vto_huge_cancel_circle
    @get:DrawableRes val WifiOff = R.drawable.vto_huge_wifi_off_01
    @get:DrawableRes val Info = R.drawable.vto_huge_information_circle

    /**
     * Resolves a semantic [VtoIcon] token into its underlying Android VectorDrawable resource ID.
     */
    @DrawableRes
    fun resolve(icon: VtoIcon): Int = icon.drawableRes
}
