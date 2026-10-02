package com.example.vtryon.feature.tryon

import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
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
import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.util.collectWithLifecycle
import com.example.vtryon.databinding.FragmentTryonBinding
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.usecase.outfit.ObserveOutfitsUseCase
import com.example.vtryon.domain.usecase.outfit.RefreshOutfitsUseCase
import com.example.vtryon.domain.usecase.tryon.CreateTryOnUseCase
import com.example.vtryon.domain.usecase.tryon.ObserveTryOnUseCase
import timber.log.Timber
import java.io.File
import java.io.FileOutputStream

class TryOnFragment : Fragment() {

    private var _binding: FragmentTryonBinding? = null
    private val binding get() = _binding!!

    private lateinit var garmentAdapter: GarmentSelectorAdapter

    private val viewModel: TryOnViewModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val app = requireActivity().application as TryOnApplication
                return TryOnViewModel(
                    createTryOnUseCase = CreateTryOnUseCase(app.tryOnRepository),
                    observeTryOnUseCase = ObserveTryOnUseCase(app.tryOnRepository),
                    observeOutfitsUseCase = ObserveOutfitsUseCase(app.outfitRepository),
                    refreshOutfitsUseCase = RefreshOutfitsUseCase(app.outfitRepository),
                    imageCompressor = app.imageCompressor
                ) as T
            }
        }
    }

    private val photoPickerLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            viewModel.onEvent(TryOnUiEvent.PersonPhotoPicked(uri))
            binding.ivPersonPhoto.loadMedia(uri, "Selected person photo")
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTryonBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupGarmentSelector()
        setupListeners()
        observeState()
        observeEffects()

        checkPreselectedOutfit()

        // Observe savedStateHandle for outfit selections returning from Catalogue / Details
        findNavController().currentBackStackEntry?.savedStateHandle
            ?.getLiveData<String>("selectedOutfitId")
            ?.observe(viewLifecycleOwner) { selectedId ->
                if (!selectedId.isNullOrBlank()) {
                    Timber.d("Received selectedOutfitId from savedStateHandle: $selectedId")
                    viewModel.onEvent(TryOnUiEvent.PreselectOutfitId(selectedId))
                    findNavController().currentBackStackEntry?.savedStateHandle?.remove<String>("selectedOutfitId")
                }
            }

        findNavController().currentBackStackEntry?.savedStateHandle
            ?.getLiveData<String>("sampleModel")
            ?.observe(viewLifecycleOwner) { modelName ->
                if (!modelName.isNullOrBlank()) {
                    loadSampleModel(modelName)
                    findNavController().currentBackStackEntry?.savedStateHandle?.remove<String>("sampleModel")
                }
            }
    }

    override fun onResume() {
        super.onResume()
        checkPreselectedOutfit()
    }

    private fun checkPreselectedOutfit() {
        val argId = arguments?.getString("outfitId")
        if (!argId.isNullOrBlank()) {
            Timber.d("checkPreselectedOutfit: found in arguments: $argId")
            viewModel.onEvent(TryOnUiEvent.PreselectOutfitId(argId))
            arguments?.remove("outfitId")
        }

        val savedId = findNavController().currentBackStackEntry?.savedStateHandle?.get<String>("selectedOutfitId")
        if (!savedId.isNullOrBlank()) {
            Timber.d("checkPreselectedOutfit: found in savedStateHandle: $savedId")
            viewModel.onEvent(TryOnUiEvent.PreselectOutfitId(savedId))
            findNavController().currentBackStackEntry?.savedStateHandle?.remove<String>("selectedOutfitId")
        }

        val argModel = arguments?.getString("sampleModel")
        if (!argModel.isNullOrBlank()) {
            loadSampleModel(argModel)
            arguments?.remove("sampleModel")
        }

        val savedModel = findNavController().currentBackStackEntry?.savedStateHandle?.get<String>("sampleModel")
        if (!savedModel.isNullOrBlank()) {
            loadSampleModel(savedModel)
            findNavController().currentBackStackEntry?.savedStateHandle?.remove<String>("sampleModel")
        }
    }

    private fun setupGarmentSelector() {
        garmentAdapter = GarmentSelectorAdapter { outfit ->
            viewModel.onEvent(TryOnUiEvent.OutfitSelected(outfit))
        }
        binding.rvGarments.layoutManager = LinearLayoutManager(
            requireContext(),
            LinearLayoutManager.HORIZONTAL,
            false
        )
        binding.rvGarments.adapter = garmentAdapter
    }

    private fun setupListeners() {
        binding.tryOnToolbar.setShowBack(true) {
            findNavController().navigateUp()
        }

        binding.cardPersonPhoto.setOnClickListener {
            viewModel.onEvent(TryOnUiEvent.PickPhotoClicked)
        }

        binding.btnPickPhoto.setOnClickListener {
            viewModel.onEvent(TryOnUiEvent.PickPhotoClicked)
        }

        binding.btnQuickModel1.setOnClickListener {
            loadSampleModel("model_male.jpg")
        }

        binding.btnQuickModel2.setOnClickListener {
            loadSampleModel("model_female.jpg")
        }

        binding.cardSelectedGarment.setOnClickListener {
            findNavController().safeNavigate(R.id.action_tryon_to_outfits)
        }

        binding.btnBrowseCatalogue.setOnClickListener {
            findNavController().safeNavigate(R.id.action_tryon_to_outfits)
        }

        binding.chipUpperBody.setOnClickListener {
            viewModel.onEvent(TryOnUiEvent.CategorySelected(OutfitCategory.UPPER_BODY))
        }

        binding.chipLowerBody.setOnClickListener {
            viewModel.onEvent(TryOnUiEvent.CategorySelected(OutfitCategory.LOWER_BODY))
        }

        binding.chipDresses.setOnClickListener {
            viewModel.onEvent(TryOnUiEvent.CategorySelected(OutfitCategory.DRESSES))
        }

        binding.btnGenerate.setOnClickListener {
            val photo = viewModel.uiState.value.personImageUri
            if (photo == null) {
                Toast.makeText(requireContext(), "Please select a portrait photo or sample model first", Toast.LENGTH_SHORT).show()
                viewModel.onEvent(TryOnUiEvent.PickPhotoClicked)
            } else {
                viewModel.onEvent(TryOnUiEvent.GenerateClicked)
            }
        }
    }

    private fun loadSampleModel(assetFileName: String) {
        try {
            val cacheFile = File(requireContext().cacheDir, assetFileName)
            requireContext().assets.open("sample_models/$assetFileName").use { input ->
                FileOutputStream(cacheFile).use { output ->
                    input.copyTo(output)
                }
            }
            val uri = Uri.fromFile(cacheFile)
            viewModel.onEvent(TryOnUiEvent.PersonPhotoPicked(uri))
            binding.ivPersonPhoto.loadMedia(uri, "Sample model photo")
            Toast.makeText(requireContext(), "Model photo loaded", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Timber.e(e, "Failed to load sample model")
            Toast.makeText(requireContext(), "Could not load sample model", Toast.LENGTH_SHORT).show()
        }
    }

    private fun observeState() {
        viewModel.uiState.collectWithLifecycle(viewLifecycleOwner) { state ->
            render(state)
        }
    }

    private fun render(state: TryOnUiState) {
        // 1. Available outfits & selection in carousel
        garmentAdapter.submitList(state.availableOutfits)
        val selected = state.selectedOutfit
        if (selected != null) {
            garmentAdapter.setSelectedId(selected.id)
            binding.tvOutfitName.text = selected.name
            binding.tvOutfitCategoryBadge.text = selected.category.displayName
            binding.ivSelectedGarment.loadMedia(selected.imageUrl, selected.name)
            binding.cardSelectedGarment.visibility = View.VISIBLE

            val index = state.availableOutfits.indexOfFirst { it.id == selected.id }
            if (index >= 0) {
                binding.rvGarments.smoothScrollToPosition(index)
            }
        }

        // 2. Category Chips state
        binding.chipUpperBody.isSelected = state.category == OutfitCategory.UPPER_BODY
        binding.chipLowerBody.isSelected = state.category == OutfitCategory.LOWER_BODY
        binding.chipDresses.isSelected = state.category == OutfitCategory.DRESSES

        // 3. Person Photo state
        if (state.personImageUri != null) {
            binding.ivPersonPhoto.loadMedia(state.personImageUri, "Selected person")
            binding.personPlaceholderContainer.visibility = View.GONE
            binding.badgePhotoSelected.visibility = View.VISIBLE
        } else {
            binding.personPlaceholderContainer.visibility = View.VISIBLE
            binding.badgePhotoSelected.visibility = View.GONE
        }

        // 4. Progress / Submission State
        val isBusy = state.isSubmitting || state.isPolling
        binding.btnGenerate.isEnabled = !isBusy
        binding.btnPickPhoto.isEnabled = !isBusy
        binding.btnQuickModel1.isEnabled = !isBusy
        binding.btnQuickModel2.isEnabled = !isBusy
        binding.btnGenerate.setLoading(isBusy)

        if (state.isSubmitting) {
            binding.loadingIndicator.visibility = View.VISIBLE
            binding.loadingIndicator.setStatus("Preparing", "Preparing your photo...")
            binding.btnGenerate.setText("Preparing...")
        } else if (state.isPolling) {
            binding.loadingIndicator.visibility = View.VISIBLE
            binding.loadingIndicator.setStatus("Fitting", "Styling garment to your silhouette...")
            binding.btnGenerate.setText("Fitting...")
        } else {
            binding.loadingIndicator.visibility = View.GONE
            if (state.personImageUri == null) {
                binding.btnGenerate.setText("Select Person Photo to Start")
            } else {
                binding.btnGenerate.setText("Generate Try-On")
            }
        }

        // 5. Error messaging
        if (state.error != null) {
            binding.tvErrorMessage.visibility = View.VISIBLE
            binding.tvErrorMessage.text = when (state.error) {
                is AppError.InvalidImage -> "Please select a valid person image."
                is AppError.ImageTooLarge -> "Image size exceeds limit. Please try another."
                is AppError.NetworkUnavailable -> "Network offline. Check your connection."
                is AppError.TryOnFailed -> "Virtual fitting could not be completed. Please try another photo or garment."
                else -> "An error occurred. Please try again."
            }
        } else {
            binding.tvErrorMessage.visibility = View.GONE
        }
    }

    private fun observeEffects() {
        viewModel.effect.collectWithLifecycle(viewLifecycleOwner) { effect ->
            when (effect) {
                is TryOnUiEffect.LaunchPhotoPicker -> {
                    photoPickerLauncher.launch("image/*")
                }
                is TryOnUiEffect.NavigateToProcessing -> {
                    findNavController().safeNavigate(
                        R.id.action_tryon_to_processing,
                        bundleOf("jobId" to effect.jobId)
                    )
                }
                is TryOnUiEffect.NavigateToResult -> {
                    findNavController().safeNavigate(
                        R.id.action_tryOn_to_result,
                        bundleOf("jobId" to effect.jobId)
                    )
                }
                is TryOnUiEffect.ShowToast -> {
                    Toast.makeText(requireContext(), effect.message, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
