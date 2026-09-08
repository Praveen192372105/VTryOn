package com.example.vtryon.core.designsystem.icon

import androidx.annotation.DrawableRes
import com.example.vtryon.R

/**
 * Legacy icon mapping pointing to official Hugeicons vector resources.
 * New code should prefer [VtoIcon] semantic tokens.
 */
object AppIcons {
    @get:DrawableRes val Back = R.drawable.vto_huge_arrow_left_02
    @get:DrawableRes val Camera = R.drawable.vto_huge_camera_01
    @get:DrawableRes val Upload = R.drawable.vto_huge_upload_04
    @get:DrawableRes val Outfit = R.drawable.vto_huge_shirt_01
    @get:DrawableRes val FavoriteOutline = R.drawable.vto_huge_favourite
    @get:DrawableRes val FavoriteFilled = R.drawable.vto_huge_favourite
    @get:DrawableRes val Share = R.drawable.vto_huge_share_08
    @get:DrawableRes val Download = R.drawable.vto_huge_download_04
    @get:DrawableRes val Refresh = R.drawable.vto_huge_refresh_01
    @get:DrawableRes val Delete = R.drawable.vto_huge_delete_02
    @get:DrawableRes val Settings = R.drawable.vto_huge_settings_01
    @get:DrawableRes val Logout = R.drawable.vto_huge_logout_01
    @get:DrawableRes val Checkmark = R.drawable.vto_huge_checkmark_circle_02
    @get:DrawableRes val Alert = R.drawable.vto_huge_alert_circle
    @get:DrawableRes val Eye = R.drawable.vto_huge_view
}
