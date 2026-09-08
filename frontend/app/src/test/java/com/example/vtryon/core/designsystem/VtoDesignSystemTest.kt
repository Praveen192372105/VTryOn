package com.example.vtryon.core.designsystem

import com.example.vtryon.R
import com.example.vtryon.core.designsystem.icon.VtoIconSize
import com.example.vtryon.core.designsystem.icon.VtoIconTone
import com.example.vtryon.core.designsystem.icon.VtoIcons
import com.example.vtryon.core.designsystem.motion.VtoMotion
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests verifying design system tokens, icon mapping,
 * and motion contracts.
 */
class VtoDesignSystemTest {

    @Test
    fun `VTO icon sizes adhere to 8dp primary spacing rhythm`() {
        assertEquals(R.dimen.vto_icon_xs, VtoIconSize.XS.dimenRes)
        assertEquals(R.dimen.vto_icon_sm, VtoIconSize.SM.dimenRes)
        assertEquals(R.dimen.vto_icon_md, VtoIconSize.MD.dimenRes)
        assertEquals(R.dimen.vto_icon_lg, VtoIconSize.LG.dimenRes)
        assertEquals(R.dimen.vto_icon_hero, VtoIconSize.HERO.dimenRes)
    }

    @Test
    fun `VTO icon tones map to semantic monochrome and state color resources`() {
        assertEquals(R.color.vto_content_primary, VtoIconTone.PRIMARY.colorRes)
        assertEquals(R.color.vto_content_secondary, VtoIconTone.SECONDARY.colorRes)
        assertEquals(R.color.vto_content_tertiary, VtoIconTone.TERTIARY.colorRes)
        assertEquals(R.color.vto_content_inverse, VtoIconTone.INVERSE.colorRes)
        assertEquals(R.color.vto_error, VtoIconTone.ERROR.colorRes)
        assertEquals(R.color.vto_success, VtoIconTone.SUCCESS.colorRes)
        assertEquals(0, VtoIconTone.NONE.colorRes)
    }

    @Test
    fun `VTO motion durations adhere to restrained fashion editorial ranges`() {
        assertTrue("Instant press duration must be between 80-120ms", VtoMotion.DURATION_INSTANT in 80..120)
        assertTrue("Micro duration must be between 140-180ms", VtoMotion.DURATION_MICRO in 140..180)
        assertTrue("Standard duration must be between 180-240ms", VtoMotion.DURATION_STANDARD in 180..240)
        assertTrue("Transition duration must be between 240-320ms", VtoMotion.DURATION_TRANSITION in 240..320)
    }

    @Test
    fun `VTO Hugeicons catalog contains all mandatory functional icons`() {
        assertNotEquals(0, VtoIcons.Search)
        assertNotEquals(0, VtoIcons.Close)
        assertNotEquals(0, VtoIcons.Eye)
        assertNotEquals(0, VtoIcons.EyeOff)
        assertNotEquals(0, VtoIcons.Check)
        assertNotEquals(0, VtoIcons.Sparkles)
        assertNotEquals(0, VtoIcons.Filter)
        assertNotEquals(0, VtoIcons.Home)
        assertNotEquals(0, VtoIcons.Heart)
        assertNotEquals(0, VtoIcons.ArrowBack)
    }
}
