package com.example.vtryon.feature.splash

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
import com.example.vtryon.core.util.collectWithLifecycle
import com.example.vtryon.databinding.FragmentSplashBinding
import com.example.vtryon.domain.usecase.auth.ObserveSessionUseCase

class SplashFragment : Fragment() {

    private var _binding: FragmentSplashBinding? = null
    private val binding get() = _binding!!

    private val viewModel: SplashViewModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val app = requireActivity().application as TryOnApplication
                return SplashViewModel(
                    observeSessionUseCase = ObserveSessionUseCase(app.authRepository)
                ) as T
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSplashBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel.effect.collectWithLifecycle(viewLifecycleOwner) { effect ->
            when (effect) {
                is SplashUiEffect.NavigateToAuth -> {
                    findNavController().navigate(R.id.action_splash_to_auth)
                }
                is SplashUiEffect.NavigateToWorkspace -> {
                    findNavController().navigate(R.id.action_splash_to_workspace)
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
