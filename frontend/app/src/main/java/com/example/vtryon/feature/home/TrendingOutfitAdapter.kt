package com.example.vtryon.feature.home

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.vtryon.databinding.ItemHomeTrendingOutfitBinding
import com.example.vtryon.domain.model.Outfit

class TrendingOutfitAdapter(
    private val onOutfitClicked: (Outfit) -> Unit
) : ListAdapter<Outfit, TrendingOutfitAdapter.TrendingViewHolder>(OutfitDiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TrendingViewHolder {
        val binding = ItemHomeTrendingOutfitBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return TrendingViewHolder(binding)
    }

    override fun onBindViewHolder(holder: TrendingViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class TrendingViewHolder(
        private val binding: ItemHomeTrendingOutfitBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(outfit: Outfit) {
            binding.tvTrendingName.text = outfit.name
            binding.tvTrendingCategory.text = outfit.category.displayName
            binding.ivTrendingThumb.loadMedia(outfit.imageUrl, outfit.name)

            binding.cardTrendingOutfit.setOnClickListener {
                onOutfitClicked(outfit)
            }
        }
    }

    companion object OutfitDiffCallback : DiffUtil.ItemCallback<Outfit>() {
        override fun areItemsTheSame(oldItem: Outfit, newItem: Outfit): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Outfit, newItem: Outfit): Boolean = oldItem == newItem
    }
}
