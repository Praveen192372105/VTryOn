package com.example.vtryon.app.navigation

import android.os.Bundle
import androidx.annotation.IdRes
import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavOptions
import androidx.navigation.navOptions
import com.example.vtryon.R

/**
 * Safe navigation extensions for AndroidX [NavController].
 *
 * Provides destination-aware validation, duplicate transition prevention,
 * and standard top-level bottom navigation stack management.
 */

/**
 * Navigates safely by validating that the current destination contains the requested action
 * or destination before dispatching, avoiding crashes from rapid double-clicks.
 */
fun NavController.safeNavigate(
    @IdRes resId: Int,
    args: Bundle? = null,
    navOptions: NavOptions? = null
) {
    val currentDest = currentDestination ?: return

    // 1. Check if resId matches an action on the current destination
    val action = currentDest.getAction(resId)
    if (action != null) {
        navigate(resId, args, navOptions)
        return
    }

    // 2. If it's a destination ID directly, guard against navigating to self if already there
    if (currentDest.id == resId) {
        // Already at destination, prevent duplicate push
        return
    }

    // 3. Dispatch safe navigation
    try {
        navigate(resId, args, navOptions)
    } catch (e: IllegalArgumentException) {
        // Current destination cannot navigate to target resId in current backstack state
    }
}

/**
 * Navigates to a top-level workspace destination with standard single-top semantics,
 * popping up to the root graph start destination and saving/restoring tab state.
 */
fun NavController.navigateToTopLevelDestination(@IdRes destinationId: Int) {
    val options = navOptions {
        popUpTo(graph.findStartDestination().id) {
            saveState = true
        }
        launchSingleTop = true
        restoreState = true
    }

    safeNavigate(destinationId, navOptions = options)
}

/**
 * Navigates to the auth graph, completely popping off the workspace back stack.
 */
fun NavController.navigateToAuthClearingWorkspace() {
    val options = navOptions {
        popUpTo(R.id.nav_root) {
            inclusive = true
        }
        launchSingleTop = true
    }
    try {
        navigate(R.id.nav_auth, null, options)
    } catch (_: Exception) {
        // Fallback direct navigation
        navigate(R.id.loginFragment, null, options)
    }
}

/**
 * Navigates to the authenticated workspace graph, completely popping the auth flow.
 */
fun NavController.navigateToWorkspaceClearingAuth() {
    val options = navOptions {
        popUpTo(R.id.nav_auth) {
            inclusive = true
        }
        launchSingleTop = true
    }
    navigate(R.id.nav_workspace, null, options)
}
