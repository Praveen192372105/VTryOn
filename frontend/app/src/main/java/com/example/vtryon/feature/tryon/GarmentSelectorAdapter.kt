package com.example.vtryon.feature.tryon

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.vtryon.R
import com.example.vtryon.databinding.ItemGarmentSelectorBinding
import com.example.vtryon.domain.model.Outfit

class GarmentSelectorAdapter(
    private val onGarmentSelected: (Outfit) -> Unit
) : ListAdapter<Outfit, GarmentSelectorAdapter.GarmentViewHolder>(GarmentDiffCallback) {

    private var selectedOutfitId: String? = null

    fun setSelectedId(outfitId: String?) {
        if (selectedOutfitId != outfitId) {
            val oldId = selectedOutfitId
            selectedOutfitId = outfitId
            // Rebind affected items
            currentList.forEachIndexed { index, outfit ->
                if (outfit.id == oldId || outfit.id == outfitId) {
                    notifyItemChanged(index)
                }
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): GarmentViewHolder {
        val binding = ItemGarmentSelectorBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return GarmentViewHolder(binding)
    }

    override fun onBindViewHolder(holder: GarmentViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class GarmentViewHolder(
        private val binding: ItemGarmentSelectorBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(outfit: Outfit) {
            val isSelected = outfit.id == selectedOutfitId

            binding.tvGarmentName.text = outfit.name
            binding.tvGarmentCategory.text = outfit.category.displayName
            binding.ivGarmentThumb.loadMedia(outfit.imageUrl, outfit.name)

            if (isSelected) {
                binding.cardGarment.setBackgroundResource(R.drawable.bg_garment_selected)
                binding.ivSelectedCheck.visibility = View.VISIBLE
            } else {
                binding.cardGarment.setBackgroundResource(R.drawable.bg_garment_unselected)
                binding.ivSelectedCheck.visibility = View.GONE
            }

            binding.cardGarment.setOnClickListener {
                setSelectedId(outfit.id)
                onGarmentSelected(outfit)
            }
        }
    }

    companion object GarmentDiffCallback : DiffUtil.ItemCallback<Outfit>() {
        override fun areItemsTheSame(oldItem: Outfit, newItem: Outfit): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Outfit, newItem: Outfit): Boolean = oldItem == newItem
    }
}
