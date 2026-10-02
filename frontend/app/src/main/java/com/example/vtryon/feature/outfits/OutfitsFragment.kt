package com.example.vtryon.feature.outfits

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
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
import com.example.vtryon.app.TryOnApplication
import com.example.vtryon.app.navigation.safeNavigate
import com.example.vtryon.core.util.collectWithLifecycle
import com.example.vtryon.databinding.FragmentOutfitsBinding
import com.example.vtryon.domain.model.OutfitCategory
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

    // Temporary pending filter state while drawer is open
    private var pendingCategory: OutfitCategory? = null
    private var pendingSort: OutfitSortOrder = OutfitSortOrder.FEATURED

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
        setupSearch()
        setupQuickCategoryChips()
        setupFilterDrawer()
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

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                val query = s?.toString().orEmpty()
                binding.btnClearSearch.visibility = if (query.isNotEmpty()) View.VISIBLE else View.GONE
                viewModel.onEvent(OutfitsUiEvent.SearchQueryChanged(query))
            }
            override fun afterTextChanged(s: Editable?) = Unit
        })

        binding.btnClearSearch.setOnClickListener {
            binding.etSearch.text?.clear()
        }
    }

    private fun setupQuickCategoryChips() {
        binding.chipCatAll.setOnClickListener {
            viewModel.onEvent(OutfitsUiEvent.CategorySelected(null))
        }
        binding.chipCatUpper.setOnClickListener {
            viewModel.onEvent(OutfitsUiEvent.CategorySelected(OutfitCategory.UPPER_BODY))
        }
        binding.chipCatLower.setOnClickListener {
            viewModel.onEvent(OutfitsUiEvent.CategorySelected(OutfitCategory.LOWER_BODY))
        }
        binding.chipCatDresses.setOnClickListener {
            viewModel.onEvent(OutfitsUiEvent.CategorySelected(OutfitCategory.DRESSES))
        }
    }

    private fun setupFilterDrawer() {
        binding.btnFilterDrawer.setOnClickListener {
            openFilterDrawer()
        }

        binding.scrimFilterBackdrop.setOnClickListener {
            closeFilterDrawer()
        }

        binding.btnCloseDrawer.setOnClickListener {
            closeFilterDrawer()
        }

        // Drawer Category Chips
        binding.drawerChipAll.setOnClickListener {
            pendingCategory = null
            updateDrawerCategoryChips()
        }
        binding.drawerChipUpper.setOnClickListener {
            pendingCategory = OutfitCategory.UPPER_BODY
            updateDrawerCategoryChips()
        }
        binding.drawerChipLower.setOnClickListener {
            pendingCategory = OutfitCategory.LOWER_BODY
            updateDrawerCategoryChips()
        }
        binding.drawerChipDresses.setOnClickListener {
            pendingCategory = OutfitCategory.DRESSES
            updateDrawerCategoryChips()
        }

        // Drawer Sort Chips
        binding.drawerSortFeatured.setOnClickListener {
            pendingSort = OutfitSortOrder.FEATURED
            updateDrawerSortChips()
        }
        binding.drawerSortNameAsc.setOnClickListener {
            pendingSort = OutfitSortOrder.NAME_ASC
            updateDrawerSortChips()
        }
        binding.drawerSortNameDesc.setOnClickListener {
            pendingSort = OutfitSortOrder.NAME_DESC
            updateDrawerSortChips()
        }

        // Drawer Reset & Apply Buttons
        binding.btnDrawerReset.setOnClickListener {
            pendingCategory = null
            pendingSort = OutfitSortOrder.FEATURED
            updateDrawerCategoryChips()
            updateDrawerSortChips()
            viewModel.onEvent(OutfitsUiEvent.ClearFilters)
            binding.etSearch.text?.clear()
            closeFilterDrawer()
        }

        binding.btnDrawerApply.setOnClickListener {
            viewModel.onEvent(OutfitsUiEvent.CategorySelected(pendingCategory))
            viewModel.onEvent(OutfitsUiEvent.SortOrderChanged(pendingSort))
            closeFilterDrawer()
        }
    }

    private fun openFilterDrawer() {
        val state = viewModel.uiState.value
        pendingCategory = state.selectedCategory
        pendingSort = state.sortOrder
        updateDrawerCategoryChips()
        updateDrawerSortChips()

        binding.scrimFilterBackdrop.visibility = View.VISIBLE
        binding.cardFilterDrawer.visibility = View.VISIBLE
        binding.cardFilterDrawer.translationY = 800f
        binding.cardFilterDrawer.animate()
            .translationY(0f)
            .setDuration(220)
            .start()
    }

    private fun closeFilterDrawer() {
        binding.cardFilterDrawer.animate()
            .translationY(800f)
            .setDuration(180)
            .withEndAction {
                binding.cardFilterDrawer.visibility = View.GONE
                binding.scrimFilterBackdrop.visibility = View.GONE
            }
            .start()
    }

    private fun updateDrawerCategoryChips() {
        binding.drawerChipAll.isSelected = (pendingCategory == null)
        binding.drawerChipUpper.isSelected = (pendingCategory == OutfitCategory.UPPER_BODY)
        binding.drawerChipLower.isSelected = (pendingCategory == OutfitCategory.LOWER_BODY)
        binding.drawerChipDresses.isSelected = (pendingCategory == OutfitCategory.DRESSES)
    }

    private fun updateDrawerSortChips() {
        binding.drawerSortFeatured.isSelected = (pendingSort == OutfitSortOrder.FEATURED)
        binding.drawerSortNameAsc.isSelected = (pendingSort == OutfitSortOrder.NAME_ASC)
        binding.drawerSortNameDesc.isSelected = (pendingSort == OutfitSortOrder.NAME_DESC)
    }

    private fun setupListeners() {
        binding.swipeRefresh.setOnRefreshListener {
            viewModel.onEvent(OutfitsUiEvent.RefreshClicked)
        }

        binding.tvResetFilters.setOnClickListener {
            binding.etSearch.text?.clear()
            viewModel.onEvent(OutfitsUiEvent.ClearFilters)
        }

        binding.emptyView.setAction("Clear Filters") {
            binding.etSearch.text?.clear()
            viewModel.onEvent(OutfitsUiEvent.ClearFilters)
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

        // Update Quick category chips
        binding.chipCatAll.isSelected = (state.selectedCategory == null)
        binding.chipCatUpper.isSelected = (state.selectedCategory == OutfitCategory.UPPER_BODY)
        binding.chipCatLower.isSelected = (state.selectedCategory == OutfitCategory.LOWER_BODY)
        binding.chipCatDresses.isSelected = (state.selectedCategory == OutfitCategory.DRESSES)

        // Filter active badge on filter button
        binding.viewFilterBadge.visibility = if (state.isFilterActive) View.VISIBLE else View.GONE

        // Results count and Reset link
        val countText = if (state.outfits.size == state.totalCount) {
            "Showing ${state.outfits.size} pieces"
        } else {
            "Filtered ${state.outfits.size} of ${state.totalCount} pieces"
        }
        binding.tvResultsCount.text = countText
        binding.tvResetFilters.visibility = if (state.isFilterActive) View.VISIBLE else View.GONE

        // Empty state handling
        if (!state.isLoading && state.outfits.isEmpty()) {
            binding.emptyView.visibility = View.VISIBLE
            binding.rvOutfits.visibility = View.GONE
        } else {
            binding.emptyView.visibility = View.GONE
            binding.rvOutfits.visibility = View.VISIBLE
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
