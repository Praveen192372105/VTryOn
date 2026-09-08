package com.example.vtryon.feature.outfits

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.vtryon.databinding.ItemOutfitBinding
import com.example.vtryon.domain.model.Outfit

class OutfitsAdapter(
    private val onOutfitClicked: (Outfit) -> Unit
) : ListAdapter<Outfit, OutfitsAdapter.OutfitViewHolder>(OutfitDiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OutfitViewHolder {
        val binding = ItemOutfitBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return OutfitViewHolder(binding, onOutfitClicked)
    }

    override fun onBindViewHolder(holder: OutfitViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class OutfitViewHolder(
        private val binding: ItemOutfitBinding,
        private val onOutfitClicked: (Outfit) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(outfit: Outfit) {
            binding.tvOutfitName.text = outfit.name
            binding.tvOutfitCategory.text = outfit.category.displayName
            binding.ivOutfit.loadMedia(outfit.imageUrl, outfit.name)

            binding.root.setOnClickListener {
                onOutfitClicked(outfit)
            }
        }
    }

    companion object OutfitDiffCallback : DiffUtil.ItemCallback<Outfit>() {
        override fun areItemsTheSame(oldItem: Outfit, newItem: Outfit): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Outfit, newItem: Outfit): Boolean = oldItem == newItem
    }
}
