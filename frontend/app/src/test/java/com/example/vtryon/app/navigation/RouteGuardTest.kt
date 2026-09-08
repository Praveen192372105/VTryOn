package com.example.vtryon.app.navigation

import com.example.vtryon.R
import com.example.vtryon.domain.model.TryOnStatus
import com.example.vtryon.domain.model.User
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests for pure deterministic route guards and state resolution.
 */
class RouteGuardTest {

    private val testUser = User(
        id = "usr_01jseeduser0000000000001",
        email = "architect@vtryon.ai",
        name = "Senior Android Architect"
    )

    @Test
    fun `booting state resolves strictly to splash destination`() {
        val route = SessionRouteResolver.resolveInitialRoute(AppSessionState.Booting)
        assertEquals(SessionRouteResolver.InitialRoute.SPLASH, route)
    }

    @Test
    fun `guest unauthenticated state resolves to login destination`() {
        val route = SessionRouteResolver.resolveInitialRoute(AppSessionState.Guest)
        assertEquals(SessionRouteResolver.InitialRoute.LOGIN, route)
    }

    @Test
    fun `expired session resolves to login destination`() {
        val route = SessionRouteResolver.resolveInitialRoute(AppSessionState.Expired)
        assertEquals(SessionRouteResolver.InitialRoute.LOGIN, route)
    }

    @Test
    fun `authenticated user resolves directly to workspace`() {
        val route = SessionRouteResolver.resolveInitialRoute(AppSessionState.Authenticated(testUser))
        assertEquals(SessionRouteResolver.InitialRoute.WORKSPACE, route)
    }

    @Test
    fun `protected destinations require authentication`() {
        assertTrue(SessionRouteResolver.isProtectedDestination(R.id.homeFragment))
        assertTrue(SessionRouteResolver.isProtectedDestination(R.id.outfitsFragment))
        assertTrue(SessionRouteResolver.isProtectedDestination(R.id.outfitDetailFragment))
        assertTrue(SessionRouteResolver.isProtectedDestination(R.id.savedFragment))
        assertTrue(SessionRouteResolver.isProtectedDestination(R.id.settingsFragment))
        assertTrue(SessionRouteResolver.isProtectedDestination(R.id.tryOnFragment))
        assertTrue(SessionRouteResolver.isProtectedDestination(R.id.tryOnProcessingFragment))
        assertTrue(SessionRouteResolver.isProtectedDestination(R.id.resultFragment))
    }

    @Test
    fun `auth destinations identified for redirecting authenticated users`() {
        assertTrue(SessionRouteResolver.isAuthDestination(R.id.loginFragment))
        assertFalse(SessionRouteResolver.isAuthDestination(R.id.homeFragment))
    }

    @Test
    fun `review and generate prerequisites guard missing person image`() {
        val allowed = SessionRouteResolver.canAccessReview(
            hasPersonPhoto = false,
            outfitId = "out_01jseedoutfit000000000001"
        )
        assertFalse(allowed)
    }

    @Test
    fun `review and generate prerequisites guard missing outfit`() {
        val allowed = SessionRouteResolver.canAccessReview(
            hasPersonPhoto = true,
            outfitId = null
        )
        assertFalse(allowed)
    }

    @Test
    fun `review and generate prerequisites allow valid person and outfit`() {
        val allowed = SessionRouteResolver.canAccessReview(
            hasPersonPhoto = true,
            outfitId = "out_01jseedoutfit000000000001"
        )
        assertTrue(allowed)
    }

    @Test
    fun `queued job maps to processing route`() {
        val route = SessionRouteResolver.resolveJobRoute(TryOnStatus.QUEUED)
        assertEquals(SessionRouteResolver.JobRoute.PROCESSING, route)
    }

    @Test
    fun `processing job maps to processing route`() {
        val route = SessionRouteResolver.resolveJobRoute(TryOnStatus.PROCESSING)
        assertEquals(SessionRouteResolver.JobRoute.PROCESSING, route)
    }

    @Test
    fun `completed job maps to result route`() {
        val route = SessionRouteResolver.resolveJobRoute(TryOnStatus.COMPLETED)
        assertEquals(SessionRouteResolver.JobRoute.RESULT, route)
    }

    @Test
    fun `failed job maps to failure state`() {
        val route = SessionRouteResolver.resolveJobRoute(TryOnStatus.FAILED)
        assertEquals(SessionRouteResolver.JobRoute.FAILED, route)
    }

    @Test
    fun `null job status maps to unknown state`() {
        val route = SessionRouteResolver.resolveJobRoute(null)
        assertEquals(SessionRouteResolver.JobRoute.UNKNOWN, route)
    }
}
