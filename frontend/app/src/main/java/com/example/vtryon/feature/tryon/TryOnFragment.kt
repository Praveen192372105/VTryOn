package com.example.vtryon.feature.tryon

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
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.example.vtryon.R
import com.example.vtryon.app.TryOnApplication
import com.example.vtryon.app.navigation.safeNavigate
import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.util.collectWithLifecycle
import com.example.vtryon.databinding.FragmentTryonBinding
import com.example.vtryon.domain.model.Outfit
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.usecase.tryon.CreateTryOnUseCase
import com.example.vtryon.domain.usecase.tryon.ObserveTryOnUseCase
import kotlinx.coroutines.launch

class TryOnFragment : Fragment() {

    private var _binding: FragmentTryonBinding? = null
    private val binding get() = _binding!!

    private val viewModel: TryOnViewModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val app = requireActivity().application as TryOnApplication
                return TryOnViewModel(
                    createTryOnUseCase = CreateTryOnUseCase(app.tryOnRepository),
                    observeTryOnUseCase = ObserveTryOnUseCase(app.tryOnRepository),
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

        val preselectedOutfitId = arguments?.getString("outfitId")
        if (!preselectedOutfitId.isNullOrBlank()) {
            val app = requireActivity().application as TryOnApplication
            viewLifecycleOwner.lifecycleScope.launch {
                when (val result = app.outfitRepository.getOutfit(preselectedOutfitId)) {
                    is com.example.vtryon.core.common.result.AppResult.Success -> {
                        viewModel.onEvent(TryOnUiEvent.OutfitSelected(result.data))
                    }
                    else -> {}
                }
            }
        } else {
            // Seed default outfit if none selected
            viewModel.onEvent(
                TryOnUiEvent.OutfitSelected(
                    Outfit(
                        id = "out_01jseedoutfit000000000001",
                        name = "Navy Blue Oxford Shirt",
                        category = OutfitCategory.UPPER_BODY,
                        imageUrl = ""
                    )
                )
            )
        }

        setupListeners()
        observeState()
        observeEffects()
    }

    private fun setupListeners() {
        binding.tryOnToolbar.setShowBack(true) {
            findNavController().navigateUp()
        }

        binding.btnPickPhoto.setOnClickListener {
            viewModel.onEvent(TryOnUiEvent.PickPhotoClicked)
        }

        binding.btnGenerate.setOnClickListener {
            viewModel.onEvent(TryOnUiEvent.GenerateClicked)
        }
    }

    private fun observeState() {
        viewModel.uiState.collectWithLifecycle(viewLifecycleOwner) { state ->
            render(state)
        }
    }

    private fun render(state: TryOnUiState) {
        val isBusy = state.isSubmitting || state.isPolling
        binding.btnGenerate.isEnabled = !isBusy
        binding.btnPickPhoto.isEnabled = !isBusy
        binding.btnGenerate.setLoading(isBusy)

        if (state.isSubmitting) {
            binding.loadingIndicator.visibility = View.VISIBLE
            binding.loadingIndicator.setStatus("Submitting", "Compressing photo & submitting job...")
            binding.btnGenerate.setText("Submitting...")
        } else if (state.isPolling) {
            binding.loadingIndicator.visibility = View.VISIBLE
            val status = state.activeJob?.status?.rawValue ?: "processing"
            binding.loadingIndicator.setStatus("Processing", "CatVTON diffusion running ($status)...")
            binding.btnGenerate.setText("Processing...")
        } else {
            binding.loadingIndicator.visibility = View.GONE
            binding.btnGenerate.setText("Generate Try-On")
        }

        if (state.selectedOutfit != null) {
            binding.tvOutfitName.text = state.selectedOutfit.name
        }

        if (state.error != null) {
            binding.tvErrorMessage.visibility = View.VISIBLE
            binding.tvErrorMessage.text = when (state.error) {
                is AppError.InvalidImage -> "Please select a valid person image."
                is AppError.ImageTooLarge -> "Image size exceeds limit. Please try another."
                is AppError.NetworkUnavailable -> "Network offline. Check your connection."
                is AppError.TryOnFailed -> "Try-On generation failed on the server."
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
