package com.example.vtryon.core.designsystem.icon

import com.example.vtryon.R
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Standard JVM Unit tests verifying the semantic Hugeicons iconography system,
 * including token resolution, XML attributes (autoMirrored, viewport, strokeWidth),
 * and asset coverage.
 */
class VtoIconSystemTest {

    private val drawableDir = File("src/main/res/drawable")

    @Test
    fun `All semantic VtoIcon instances resolve to valid non-zero resource IDs`() {
        val allIcons = listOf(
            // Navigation
            VtoIcon.Back,
            VtoIcon.Forward,
            VtoIcon.Close,
            VtoIcon.Home,
            VtoIcon.TryOn,
            VtoIcon.Saved,
            VtoIcon.Settings,
            // Auth
            VtoIcon.User,
            VtoIcon.Lock,
            VtoIcon.ShowPassword,
            VtoIcon.HidePassword,
            VtoIcon.Logout,
            // Media
            VtoIcon.Upload,
            VtoIcon.Gallery,
            VtoIcon.Image,
            VtoIcon.Camera,
            VtoIcon.Delete,
            VtoIcon.Refresh,
            VtoIcon.Fullscreen,
            // Outfits & Catalog
            VtoIcon.Favorite,
            VtoIcon.Search,
            VtoIcon.ClearSearch,
            VtoIcon.Filter,
            VtoIcon.Grid,
            VtoIcon.List,
            VtoIcon.Garment,
            // Try-On & Results
            VtoIcon.Generate,
            VtoIcon.Compare,
            VtoIcon.Save,
            VtoIcon.Share,
            VtoIcon.Download,
            // Feedback & Status
            VtoIcon.Check,
            VtoIcon.Success,
            VtoIcon.Warning,
            VtoIcon.Error,
            VtoIcon.Offline,
            VtoIcon.Info
        )

        allIcons.forEach { icon ->
            assertNotEquals("Drawable resource ID for $icon must not be 0", 0, icon.drawableRes)
            assertEquals("VtoIcons.resolve() must match icon.drawableRes", icon.drawableRes, VtoIcons.resolve(icon))
        }
    }

    @Test
    fun `Directional navigation icons must declare android autoMirrored true`() {
        val backFile = File(drawableDir, "vto_huge_arrow_left_02.xml")
        assertTrue("vto_huge_arrow_left_02.xml must exist", backFile.exists())
        val backContent = backFile.readText()
        assertTrue("Back arrow must declare android:autoMirrored=\"true\"", backContent.contains("android:autoMirrored=\"true\""))

        val forwardFile = File(drawableDir, "vto_huge_arrow_right_02.xml")
        assertTrue("vto_huge_arrow_right_02.xml must exist", forwardFile.exists())
        val forwardContent = forwardFile.readText()
        assertTrue("Forward arrow must declare android:autoMirrored=\"true\"", forwardContent.contains("android:autoMirrored=\"true\""))
    }

    @Test
    fun `Non-directional icons must NOT declare android autoMirrored`() {
        val nonDirectional = listOf(
            "vto_huge_camera_01.xml",
            "vto_huge_cancel_01.xml",
            "vto_huge_favourite.xml",
            "vto_huge_settings_01.xml",
            "vto_huge_sparkles.xml",
            "vto_huge_upload_04.xml",
            "vto_huge_home_01.xml"
        )

        nonDirectional.forEach { filename ->
            val file = File(drawableDir, filename)
            assertTrue("$filename must exist", file.exists())
            val content = file.readText()
            assertTrue("$filename must not auto-mirror", !content.contains("android:autoMirrored=\"true\""))
        }
    }

    @Test
    fun `All Hugeicons VectorDrawables conform to 24x24 viewport and 1_5 stroke width`() {
        val hugeiconFiles = drawableDir.listFiles { _, name -> name.startsWith("vto_huge_") && name.endsWith(".xml") }
        assertNotNull("Hugeicon files array must not be null", hugeiconFiles)
        assertTrue("Must have generated Hugeicon vector files", hugeiconFiles!!.isNotEmpty())

        hugeiconFiles.forEach { file ->
            val content = file.readText()
            assertTrue("${file.name} must start with <vector", content.contains("<vector"))
            assertTrue("${file.name} must have viewportWidth 24", content.contains("android:viewportWidth=\"24\""))
            assertTrue("${file.name} must have viewportHeight 24", content.contains("android:viewportHeight=\"24\""))
            assertTrue("${file.name} must use standard stroke width 1.5", content.contains("android:strokeWidth=\"1.5\""))
        }
    }

    @Test
    fun `VtoIcon Custom adapter works as expected for custom drawables`() {
        val custom = VtoIcon.Custom(R.drawable.vto_huge_sparkles, R.string.a11y_try_on)
        assertEquals(R.drawable.vto_huge_sparkles, custom.drawableRes)
        assertEquals(R.string.a11y_try_on, custom.defaultContentDescriptionRes)
        assertEquals(R.drawable.vto_huge_sparkles, VtoIcons.resolve(custom))
    }

    private fun assertNotNull(message: String, value: Any?) {
        org.junit.Assert.assertNotNull(message, value)
    }
}
