package com.example.vtryon.app.navigation

import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.NavController
import com.example.vtryon.domain.model.User
import com.example.vtryon.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch

/**
 * Application-level routing and session coordinator.
 * Observes user authentication state and coordinates route guard redirects
 * without leaking lifecycle components or coupling NavController to repositories.
 */
class SessionCoordinator(
    private val authRepository: AuthRepository
) {

    private val _sessionState = MutableStateFlow<AppSessionState>(AppSessionState.Booting)
    val sessionState: StateFlow<AppSessionState> = _sessionState.asStateFlow()

    init {
        // Initial boot state resolution from secure local store
        val hasActive = authRepository.hasActiveSession()
        _sessionState.value = if (hasActive) {
            AppSessionState.Authenticated(User(id = "", email = "", name = ""))
        } else {
            AppSessionState.Guest
        }
    }

    /**
     * Binds the coordinator to the host Activity lifecycle and NavController.
     * Enforces route guards when session state transitions or destinations change.
     */
    fun attach(
        lifecycleOwner: LifecycleOwner,
        navController: NavController
    ) {
        // 1. Observe session flow from repository
        lifecycleOwner.lifecycleScope.launch {
            lifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                authRepository.observeSession()
                    .distinctUntilChanged()
                    .collect { user ->
                        val newState = if (user != null) {
                            AppSessionState.Authenticated(user)
                        } else {
                            if (_sessionState.value is AppSessionState.Authenticated) {
                                AppSessionState.Expired
                            } else {
                                AppSessionState.Guest
                            }
                        }
                        _sessionState.value = newState
                        enforceGuard(newState, navController)
                    }
            }
        }

        // 2. Observe destination changes to prevent unauthorized navigation
        navController.addOnDestinationChangedListener { _, destination, _ ->
            enforceGuard(_sessionState.value, navController, destination.id)
        }
    }

    private fun enforceGuard(
        state: AppSessionState,
        navController: NavController,
        currentDestinationId: Int? = navController.currentDestination?.id
    ) {
        val destId = currentDestinationId ?: return

        when (state) {
            is AppSessionState.Booting -> {
                // Stay on splash until resolution completes
            }
            is AppSessionState.Guest, is AppSessionState.Expired -> {
                // If attempting to access or stay in a protected screen, redirect to Auth
                if (SessionRouteResolver.isProtectedDestination(destId)) {
                    navController.navigateToAuthClearingWorkspace()
                }
            }
            is AppSessionState.Authenticated -> {
                // If authenticated user attempts to access login/auth, redirect to Workspace
                if (SessionRouteResolver.isAuthDestination(destId)) {
                    navController.navigateToWorkspaceClearingAuth()
                }
            }
        }
    }

    /**
     * Explicit session expiration / logout trigger.
     */
    suspend fun logout(navController: NavController) {
        authRepository.logout()
        _sessionState.value = AppSessionState.Guest
        navController.navigateToAuthClearingWorkspace()
    }
}
