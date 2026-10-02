package com.example.vtryon.feature.settings

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.vtryon.R
import com.example.vtryon.app.TryOnApplication
import com.example.vtryon.app.navigation.safeNavigate
import com.example.vtryon.core.designsystem.icon.VtoIcon
import com.example.vtryon.core.util.collectWithLifecycle
import com.example.vtryon.databinding.FragmentSettingsBinding
import com.example.vtryon.domain.model.TryOnJob

class SettingsFragment : Fragment() {

    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    private lateinit var historyAdapter: SettingsHistoryAdapter

    private val viewModel: SettingsViewModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val app = requireActivity().application as TryOnApplication
                return SettingsViewModel(
                    authRepository = app.authRepository,
                    tryOnRepository = app.tryOnRepository,
                    settingsStore = app.settingsStore
                ) as T
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupHistoryAdapter()
        setupListeners()
        observeViewModel()
    }

    private fun setupHistoryAdapter() {
        historyAdapter = SettingsHistoryAdapter(
            onJobClicked = { job ->
                val bundle = bundleOf("jobId" to job.id)
                findNavController().safeNavigate(R.id.action_settings_to_result, bundle)
            },
            onTryAgainClicked = { job ->
                val outfitId = job.garmentImageUrl
                try {
                    val tryOnEntry = findNavController().getBackStackEntry(R.id.tryOnFragment)
                    tryOnEntry.savedStateHandle.set("selectedOutfitId", outfitId)
                    findNavController().popBackStack(R.id.tryOnFragment, false)
                } catch (_: Exception) {
                    val bundle = bundleOf("outfitId" to outfitId)
                    findNavController().safeNavigate(R.id.action_settings_to_tryon, bundle)
                }
            },
            onSaveClicked = { job ->
                viewModel.onEvent(SettingsUiEvent.ToggleSave(job.id, !job.isSaved))
            },
            onDeleteClicked = { job ->
                viewModel.onEvent(SettingsUiEvent.DeleteJob(job.id))
            }
        )

        binding.rvHistory.layoutManager = LinearLayoutManager(requireContext())
        binding.rvHistory.adapter = historyAdapter
    }

    private fun setupListeners() {
        binding.btnRefreshHistory.setIcon(VtoIcon.Refresh)
        binding.btnRefreshHistory.setOnClickListener {
            viewModel.onEvent(SettingsUiEvent.RefreshHistory)
        }

        binding.btnOpenStudio.setOnClickListener {
            findNavController().safeNavigate(R.id.action_settings_to_tryon)
        }

        binding.btnSignOut.setOnClickListener {
            viewModel.onEvent(SettingsUiEvent.SignOutClicked)
        }

        binding.switchDarkMode.setOnCheckedChangeListener { buttonView, isChecked ->
            if (buttonView.isPressed && isChecked != viewModel.uiState.value.isDarkMode) {
                viewModel.onEvent(SettingsUiEvent.DarkModeToggled(isChecked))
            }
        }

        binding.cardAppearance.setOnClickListener {
            val target = !binding.switchDarkMode.isChecked
            binding.switchDarkMode.isChecked = target
            viewModel.onEvent(SettingsUiEvent.DarkModeToggled(target))
        }
    }

    private fun observeViewModel() {
        viewModel.uiState.collectWithLifecycle(viewLifecycleOwner) { state ->
            render(state)
        }

        viewModel.effect.collectWithLifecycle(viewLifecycleOwner) { effect ->
            when (effect) {
                is SettingsUiEffect.NavigateToAuth -> {
                    findNavController().safeNavigate(R.id.action_settings_to_auth)
                }
                is SettingsUiEffect.ShowToast -> {
                    context?.let { ctx ->
                        Toast.makeText(ctx, effect.message, Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    private fun render(state: SettingsUiState) {
        binding.tvUserAvatar.text = state.userInitial
        binding.tvUserName.text = state.userName.ifBlank { "Studio Member" }
        binding.tvUserEmail.text = state.userEmail.ifBlank { "Active Session" }

        binding.tvStatFittingsCount.text = state.totalFittings.toString()
        binding.tvStatSavedCount.text = state.savedCount.toString()

        if (binding.switchDarkMode.isChecked != state.isDarkMode) {
            binding.switchDarkMode.isChecked = state.isDarkMode
        }

        binding.historyLoadingIndicator.visibility =
            if (state.isRefreshing || (state.isHistoryLoading && state.history.isEmpty())) {
                View.VISIBLE
            } else {
                View.GONE
            }

        historyAdapter.submitList(state.history)

        if (!state.isHistoryLoading && state.history.isEmpty()) {
            binding.emptyHistoryView.visibility = View.VISIBLE
            binding.rvHistory.visibility = View.GONE
        } else {
            binding.emptyHistoryView.visibility = View.GONE
            binding.rvHistory.visibility = View.VISIBLE
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
