package com.example.vtryon.feature.settings

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import com.example.vtryon.R
import com.example.vtryon.app.TryOnApplication
import com.example.vtryon.app.navigation.safeNavigate
import com.example.vtryon.core.util.collectWithLifecycle
import com.example.vtryon.databinding.FragmentSettingsBinding

class SettingsFragment : Fragment() {

    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    private val viewModel: SettingsViewModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val app = requireActivity().application as TryOnApplication
                return SettingsViewModel(
                    authRepository = app.authRepository,
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

        binding.btnSignOut.setOnClickListener {
            viewModel.onEvent(SettingsUiEvent.SignOutClicked)
        }

        viewModel.uiState.collectWithLifecycle(viewLifecycleOwner) { state ->
            render(state)
        }

        viewModel.effect.collectWithLifecycle(viewLifecycleOwner) { effect ->
            when (effect) {
                is SettingsUiEffect.NavigateToAuth -> {
                    findNavController().safeNavigate(R.id.action_settings_to_auth)
                }
            }
        }
    }

    private fun render(state: SettingsUiState) {
        binding.tvUserName.text = state.userName.ifBlank { "Virtual Try-On User" }
        binding.tvUserEmail.text = state.userEmail.ifBlank { "Active Session" }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
