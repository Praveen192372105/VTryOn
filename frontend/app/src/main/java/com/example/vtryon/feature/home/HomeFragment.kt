package com.example.vtryon.feature.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
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
import com.example.vtryon.core.util.collectWithLifecycle
import com.example.vtryon.databinding.FragmentHomeBinding
import com.example.vtryon.domain.usecase.auth.ObserveSessionUseCase
import com.example.vtryon.domain.usecase.outfit.ObserveOutfitsUseCase
import com.example.vtryon.domain.usecase.outfit.RefreshOutfitsUseCase

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private lateinit var trendingAdapter: TrendingOutfitAdapter

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

        setupTrendingCarousel()
        setupListeners()
        observeState()
    }

    private fun setupTrendingCarousel() {
        trendingAdapter = TrendingOutfitAdapter { outfit ->
            // One-tap launch into Try-On Studio with chosen garment pre-selected!
            val bundle = bundleOf("outfitId" to outfit.id)
            findNavController().safeNavigate(R.id.action_home_to_tryon, bundle)
        }
        binding.rvTrendingOutfits.layoutManager = LinearLayoutManager(
            requireContext(),
            LinearLayoutManager.HORIZONTAL,
            false
        )
        binding.rvTrendingOutfits.adapter = trendingAdapter
    }

    private fun setupListeners() {
        // Hero Launch Studio button
        binding.btnStartTryOn.setOnClickListener {
            findNavController().safeNavigate(R.id.action_home_to_tryon)
        }

        // Entire Hero Card click
        binding.cardHeroStudio.setOnClickListener {
            findNavController().safeNavigate(R.id.action_home_to_tryon)
        }

        // Browse All Trending Link
        binding.btnViewAllTrending.setOnClickListener {
            findNavController().safeNavigate(R.id.action_home_to_outfits)
        }

        // Quick Category Cards
        binding.cardCatTops.setOnClickListener {
            findNavController().safeNavigate(R.id.action_home_to_outfits)
        }

        binding.cardCatBottoms.setOnClickListener {
            findNavController().safeNavigate(R.id.action_home_to_outfits)
        }

        binding.cardCatDresses.setOnClickListener {
            findNavController().safeNavigate(R.id.action_home_to_outfits)
        }
    }

    private fun observeState() {
        viewModel.uiState.collectWithLifecycle(viewLifecycleOwner) { state ->
            render(state)
        }
    }

    private fun render(state: HomeUiState) {
        val userName = state.user?.name?.ifBlank { "Eswar Chinthakayala" } ?: "Eswar Chinthakayala"
        binding.tvUserName.text = userName

        if (state.recentOutfits.isNotEmpty()) {
            trendingAdapter.submitList(state.recentOutfits)
            binding.rvTrendingOutfits.visibility = View.VISIBLE
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
