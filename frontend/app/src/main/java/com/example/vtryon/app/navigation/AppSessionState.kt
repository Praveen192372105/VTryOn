package com.example.vtryon.app.navigation

import com.example.vtryon.domain.model.User

/**
 * High-level application session states for deterministic root routing and route guards.
 */
sealed interface AppSessionState {

    /** Application is booting and validating local credentials from Keystore/DataStore. */
    data object Booting : AppSessionState

    /** No active user session exists (unauthenticated guest). */
    data object Guest : AppSessionState

    /** User is authenticated with an active valid token. */
    data class Authenticated(val user: User) : AppSessionState

    /** Session expired or was invalidated by server 401 response. */
    data object Expired : AppSessionState
}
