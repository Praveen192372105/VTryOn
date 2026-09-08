package com.example.vtryon.feature.outfits.detail

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.example.vtryon.R
import com.example.vtryon.app.TryOnApplication
import com.example.vtryon.app.navigation.safeNavigate
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.databinding.FragmentOutfitDetailBinding
import com.example.vtryon.domain.model.Outfit
import kotlinx.coroutines.launch

class OutfitDetailFragment : Fragment() {

    private var _binding: FragmentOutfitDetailBinding? = null
    private val binding get() = _binding!!

    private var currentOutfit: Outfit? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentOutfitDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val outfitId = arguments?.getString("outfitId").orEmpty()

        setupListeners(outfitId)
        loadOutfit(outfitId)
    }

    private fun setupListeners(outfitId: String) {
        binding.detailToolbar.setShowBack(true) {
            findNavController().navigateUp()
        }

        binding.btnTryThisOutfit.setOnClickListener {
            // Forward navigation to Try-On Studio with selected outfit pre-populated
            val bundle = bundleOf("outfitId" to outfitId)
            findNavController().safeNavigate(R.id.action_outfitDetail_to_tryon, bundle)
        }
    }

    private fun loadOutfit(outfitId: String) {
        if (outfitId.isBlank()) return

        val app = requireActivity().application as TryOnApplication
        val repository = app.outfitRepository

        binding.loadingIndicator.visibility = View.VISIBLE
        viewLifecycleOwner.lifecycleScope.launch {
            when (val result = repository.getOutfit(outfitId)) {
                is AppResult.Success<Outfit> -> {
                    binding.loadingIndicator.visibility = View.GONE
                    val outfit = result.data
                    currentOutfit = outfit
                    render(outfit)
                }
                is AppResult.Error -> {
                    binding.loadingIndicator.visibility = View.GONE
                    binding.tvOutfitName.text = "Outfit unavailable"
                    binding.btnTryThisOutfit.isEnabled = false
                }
            }
        }
    }

    private fun render(outfit: Outfit) {
        binding.tvOutfitName.text = outfit.name
        binding.tvOutfitCategory.text = outfit.category.displayName
        if (!outfit.description.isNullOrBlank()) {
            binding.tvOutfitDescription.text = outfit.description
        }
        if (outfit.imageUrl.isNotBlank()) {
            binding.ivOutfitImage.loadMedia(outfit.imageUrl, outfit.name)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
