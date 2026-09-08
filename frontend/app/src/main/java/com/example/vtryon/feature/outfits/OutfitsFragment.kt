package com.example.vtryon.feature.outfits

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
import androidx.recyclerview.widget.GridLayoutManager
import com.example.vtryon.R
import com.example.vtryon.app.navigation.safeNavigate
import com.example.vtryon.app.TryOnApplication
import com.example.vtryon.core.util.collectWithLifecycle
import com.example.vtryon.databinding.FragmentOutfitsBinding
import com.example.vtryon.domain.usecase.outfit.ObserveOutfitsUseCase
import com.example.vtryon.domain.usecase.outfit.RefreshOutfitsUseCase

class OutfitsFragment : Fragment() {

    private var _binding: FragmentOutfitsBinding? = null
    private val binding get() = _binding!!

    private val viewModel: OutfitsViewModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val app = requireActivity().application as TryOnApplication
                return OutfitsViewModel(
                    observeOutfitsUseCase = ObserveOutfitsUseCase(app.outfitRepository),
                    refreshOutfitsUseCase = RefreshOutfitsUseCase(app.outfitRepository)
                ) as T
            }
        }
    }

    private lateinit var adapter: OutfitsAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentOutfitsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        setupListeners()
        observeState()
    }

    private fun setupRecyclerView() {
        adapter = OutfitsAdapter { outfit ->
            val bundle = bundleOf("outfitId" to outfit.id)
            findNavController().safeNavigate(R.id.action_outfits_to_outfitDetail, bundle)
        }
        binding.rvOutfits.layoutManager = GridLayoutManager(requireContext(), 2)
        binding.rvOutfits.adapter = adapter
    }

    private fun setupListeners() {
        binding.swipeRefresh.setOnRefreshListener {
            viewModel.onEvent(OutfitsUiEvent.RefreshClicked)
        }
    }

    private fun observeState() {
        viewModel.uiState.collectWithLifecycle(viewLifecycleOwner) { state ->
            render(state)
        }
    }

    private fun render(state: OutfitsUiState) {
        binding.swipeRefresh.isRefreshing = state.isLoading
        adapter.submitList(state.outfits)

        if (!state.isLoading && state.outfits.isEmpty()) {
            binding.emptyView.visibility = View.VISIBLE
        } else {
            binding.emptyView.visibility = View.GONE
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
