package com.example.vtryon.app

import android.os.Bundle
import android.view.View
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavController
import kotlinx.coroutines.launch
import androidx.navigation.fragment.NavHostFragment
import com.example.vtryon.R
import com.example.vtryon.app.navigation.SessionCoordinator
import com.example.vtryon.app.navigation.navigateToTopLevelDestination
import com.example.vtryon.core.designsystem.component.navigation.VtoBottomBar
import com.example.vtryon.core.designsystem.icon.VtoIcon
import com.example.vtryon.core.util.EdgeToEdgeHelper
import com.example.vtryon.databinding.ActivityAppBinding

/**
 * Single-Activity application host.
 * Owns root NavHostFragment, VtoBottomBar, session route coordinator,
 * and adaptive tablet side rail navigation.
 */
class AppActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAppBinding
    private lateinit var navController: NavController
    lateinit var sessionCoordinator: SessionCoordinator
        private set

    private val topLevelDestinations = setOf(
        R.id.homeFragment,
        R.id.outfitsFragment,
        R.id.savedFragment,
        R.id.settingsFragment
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        binding = ActivityAppBinding.inflate(layoutInflater)
        setContentView(binding.root)

        EdgeToEdgeHelper.applySystemBarInsets(binding.appRootContainer)

        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.navHostFragment) as NavHostFragment
        navController = navHostFragment.navController

        setupSessionCoordinator()
        setupBottomNavigation()
        setupTabletNavigation()
        setupDestinationListener()
        setupThemeObserver()
    }

    private fun setupThemeObserver() {
        lifecycleScope.launch {
            val app = application as TryOnApplication
            app.settingsStore.themeMode.collect { mode ->
                val nightMode = when (mode) {
                    com.example.vtryon.core.datastore.AppSettingsStore.ThemeMode.DARK -> androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_YES
                    com.example.vtryon.core.datastore.AppSettingsStore.ThemeMode.LIGHT -> androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_NO
                    com.example.vtryon.core.datastore.AppSettingsStore.ThemeMode.SYSTEM -> androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
                }
                if (androidx.appcompat.app.AppCompatDelegate.getDefaultNightMode() != nightMode) {
                    androidx.appcompat.app.AppCompatDelegate.setDefaultNightMode(nightMode)
                }
                if (delegate.localNightMode != nightMode) {
                    delegate.localNightMode = nightMode
                }
            }
        }
    }

    private fun setupSessionCoordinator() {
        val app = application as TryOnApplication
        sessionCoordinator = SessionCoordinator(app.authRepository)
        sessionCoordinator.attach(this, navController)
    }

    private fun setupBottomNavigation() {
        val isTablet = binding.tabletSideNav != null

        // If tablet layout is active, suppress bottom bar
        if (isTablet) {
            binding.bottomBar.visibility = View.GONE
            return
        }

        binding.bottomBar.setItems(
            listOf(
                VtoBottomBar.Item(R.id.homeFragment, VtoIcon.Home, "Home"),
                VtoBottomBar.Item(R.id.outfitsFragment, VtoIcon.Garment, "Catalogue"),
                VtoBottomBar.Item(R.id.nav_tryon, VtoIcon.TryOn, "Try-On"),
                VtoBottomBar.Item(R.id.savedFragment, VtoIcon.Saved, "Saved"),
                VtoBottomBar.Item(R.id.settingsFragment, VtoIcon.Settings, "Settings")
            )
        )

        binding.bottomBar.onItemSelectedListener = { destinationId, _ ->
            navController.navigateToTopLevelDestination(destinationId)
        }
    }

    private fun setupTabletNavigation() {
        val sideNav = binding.tabletSideNav ?: return

        binding.tabletLogo?.setIcon(VtoIcon.TryOn)
        binding.tabTabletHome?.setIcon(VtoIcon.Home)
        binding.tabTabletCatalogue?.setIcon(VtoIcon.Garment)
        binding.tabTabletTryOn?.setIcon(VtoIcon.TryOn)
        binding.tabTabletSaved?.setIcon(VtoIcon.Saved)
        binding.tabTabletSettings?.setIcon(VtoIcon.Settings)

        binding.tabTabletHome?.setOnClickListener {
            navController.navigateToTopLevelDestination(R.id.homeFragment)
        }
        binding.tabTabletCatalogue?.setOnClickListener {
            navController.navigateToTopLevelDestination(R.id.outfitsFragment)
        }
        binding.tabTabletTryOn?.setOnClickListener {
            navController.navigateToTopLevelDestination(R.id.nav_tryon)
        }
        binding.tabTabletSaved?.setOnClickListener {
            navController.navigateToTopLevelDestination(R.id.savedFragment)
        }
        binding.tabTabletSettings?.setOnClickListener {
            navController.navigateToTopLevelDestination(R.id.settingsFragment)
        }
    }

    private fun setupDestinationListener() {
        val isTablet = binding.tabletSideNav != null

        navController.addOnDestinationChangedListener { _, destination, _ ->
            val isTopLevel = destination.id in topLevelDestinations

            if (isTablet) {
                // Adaptive tablet side-rail visibility
                binding.bottomBar.visibility = View.GONE
                binding.tabletSideNav?.visibility = if (isTopLevel) View.VISIBLE else View.GONE
            } else {
                // Phone bottom bar visibility
                binding.bottomBar.visibility = if (isTopLevel) View.VISIBLE else View.GONE
                if (isTopLevel) {
                    binding.bottomBar.setSelectedDestination(destination.id)
                }
            }
        }
    }
}
