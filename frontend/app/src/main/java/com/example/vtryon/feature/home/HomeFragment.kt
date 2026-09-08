package com.example.vtryon.feature.home

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
import com.example.vtryon.databinding.FragmentHomeBinding
import com.example.vtryon.domain.usecase.auth.ObserveSessionUseCase
import com.example.vtryon.domain.usecase.outfit.ObserveOutfitsUseCase
import com.example.vtryon.domain.usecase.outfit.RefreshOutfitsUseCase

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private val viewModel: HomeViewModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val app = requireActivity().application as TryOnApplication
                return HomeViewModel(
                    observeSessionUseCase = ObserveSessionUseCase(app.authRepository),
                    observeOutfitsUseCase = ObserveOutfitsUseCase(app.outfitRepository),
                    refreshOutfitsUseCase = RefreshOutfitsUseCase(app.outfitRepository)
                ) as T
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnStartTryOn.setOnClickListener {
            findNavController().navigate(R.id.action_home_to_tryon)
        }

        binding.btnViewCatalogue.setOnClickListener {
            findNavController().navigate(R.id.action_home_to_outfits)
        }

        viewModel.uiState.collectWithLifecycle(viewLifecycleOwner) { state ->
            render(state)
        }
    }

    private fun render(state: HomeUiState) {
        if (state.user != null) {
            binding.homeToolbar.setTitle(state.user.name.ifBlank { "V Try-On" })
            binding.homeToolbar.setSubtitle("Studio")
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
