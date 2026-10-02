package com.example.vtryon.feature.outfits.detail

import android.content.res.ColorStateList
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
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
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class OutfitDetailFragment : Fragment() {

    private var _binding: FragmentOutfitDetailBinding? = null
    private val binding get() = _binding!!

    private var currentOutfit: Outfit? = null
    private var isFavorite = false

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
        observeFavorites(outfitId)
        loadOutfit(outfitId)
    }

    private fun setupListeners(outfitId: String) {
        val app = requireActivity().application as TryOnApplication

        binding.detailToolbar.setShowBack(true) {
            findNavController().navigateUp()
        }

        binding.btnFavorite.setOnClickListener {
            viewLifecycleOwner.lifecycleScope.launch {
                app.settingsStore.toggleLocalBookmark(outfitId)
                val msg = if (!isFavorite) "Saved to your favorites" else "Removed from favorites"
                Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()
            }
        }

        binding.btnTryThisOutfit.setOnClickListener {
            launchStudio(outfitId, sampleModel = null)
        }

        binding.cardModel1Preview.setOnClickListener {
            launchStudio(outfitId, sampleModel = "model_male.jpg")
        }

        binding.cardModel2Preview.setOnClickListener {
            launchStudio(outfitId, sampleModel = "model_female.jpg")
        }
    }

    private fun launchStudio(outfitId: String, sampleModel: String?) {
        val bundle = bundleOf(
            "outfitId" to outfitId,
            "sampleModel" to sampleModel
        )
        try {
            val tryOnEntry = findNavController().getBackStackEntry(R.id.tryOnFragment)
            tryOnEntry.savedStateHandle.set("selectedOutfitId", outfitId)
            if (sampleModel != null) {
                tryOnEntry.savedStateHandle.set("sampleModel", sampleModel)
            }
            findNavController().popBackStack(R.id.tryOnFragment, false)
        } catch (_: Exception) {
            findNavController().safeNavigate(R.id.action_outfitDetail_to_tryon, bundle)
        }
    }

    private fun observeFavorites(outfitId: String) {
        val app = requireActivity().application as TryOnApplication
        viewLifecycleOwner.lifecycleScope.launch {
            app.settingsStore.localBookmarks.collectLatest { bookmarks ->
                val fav = bookmarks.contains(outfitId)
                isFavorite = fav
                updateFavoriteUi(fav)
            }
        }
    }

    private fun updateFavoriteUi(fav: Boolean) {
        val context = context ?: return
        if (fav) {
            binding.ivFavoriteIcon.setImageResource(R.drawable.ic_heart_filled)
            val brandColor = ContextCompat.getColor(context, R.color.vto_brand)
            binding.ivFavoriteIcon.imageTintList = ColorStateList.valueOf(brandColor)
        } else {
            binding.ivFavoriteIcon.setImageResource(R.drawable.ic_heart)
            val normalColor = ContextCompat.getColor(context, R.color.vto_content_secondary)
            binding.ivFavoriteIcon.imageTintList = ColorStateList.valueOf(normalColor)
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
        binding.tvOutfitCategory.text = outfit.category.displayName.uppercase()
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
