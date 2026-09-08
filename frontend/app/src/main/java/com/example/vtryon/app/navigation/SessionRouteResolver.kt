package com.example.vtryon.app.navigation

import com.example.vtryon.R
import com.example.vtryon.domain.model.TryOnStatus

/**
 * Pure, deterministic routing and guard decision engine.
 * Decouples business routing rules from Android Views and Fragment lifecycles.
 */
object SessionRouteResolver {

    enum class InitialRoute {
        SPLASH,
        LOGIN,
        WORKSPACE
    }

    enum class JobRoute {
        PROCESSING,
        RESULT,
        FAILED,
        UNKNOWN
    }

    /**
     * Resolves the startup destination based on session state and onboarding preference.
     */
    fun resolveInitialRoute(
        sessionState: AppSessionState,
        onboardingCompleted: Boolean = true
    ): InitialRoute {
        return when (sessionState) {
            is AppSessionState.Booting -> InitialRoute.SPLASH
            is AppSessionState.Guest, is AppSessionState.Expired -> InitialRoute.LOGIN
            is AppSessionState.Authenticated -> InitialRoute.WORKSPACE
        }
    }

    /**
     * Set of destinations requiring an active authenticated user session.
     */
    val protectedDestinationIds: Set<Int> = setOf(
        R.id.homeFragment,
        R.id.outfitsFragment,
        R.id.outfitDetailFragment,
        R.id.savedFragment,
        R.id.settingsFragment,
        R.id.tryOnFragment,
        R.id.tryOnProcessingFragment,
        R.id.resultFragment
    )

    /**
     * Set of destinations for unauthenticated user interaction.
     */
    val authDestinationIds: Set<Int> = setOf(
        R.id.loginFragment
    )

    /**
     * Returns true if the destination requires authentication.
     */
    fun isProtectedDestination(destinationId: Int): Boolean {
        return destinationId in protectedDestinationIds
    }

    /**
     * Returns true if the destination is part of the auth flow.
     */
    fun isAuthDestination(destinationId: Int): Boolean {
        return destinationId in authDestinationIds
    }

    /**
     * Prerequisite guard: Virtual Try-On review and generation strictly require
     * both a valid person image and an identified garment.
     */
    fun canAccessReview(hasPersonPhoto: Boolean, outfitId: String?): Boolean {
        return hasPersonPhoto && !outfitId.isNullOrBlank()
    }

    /**
     * Deterministically maps backend job status to the appropriate navigation destination.
     */
    fun resolveJobRoute(status: TryOnStatus?): JobRoute {
        return when (status) {
            TryOnStatus.QUEUED, TryOnStatus.PROCESSING -> JobRoute.PROCESSING
            TryOnStatus.COMPLETED -> JobRoute.RESULT
            TryOnStatus.FAILED -> JobRoute.FAILED
            null -> JobRoute.UNKNOWN
        }
    }
}
