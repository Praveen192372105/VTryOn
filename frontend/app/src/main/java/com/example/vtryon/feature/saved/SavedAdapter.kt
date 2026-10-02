package com.example.vtryon.feature.saved

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.vtryon.databinding.ItemSavedBinding
import com.example.vtryon.domain.model.TryOnJob
import com.example.vtryon.domain.model.TryOnStatus

class SavedAdapter(
    private val onJobClicked: (TryOnJob) -> Unit
) : ListAdapter<TryOnJob, SavedAdapter.SavedViewHolder>(SavedDiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SavedViewHolder {
        val binding = ItemSavedBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return SavedViewHolder(binding, onJobClicked)
    }

    override fun onBindViewHolder(holder: SavedViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class SavedViewHolder(
        private val binding: ItemSavedBinding,
        private val onJobClicked: (TryOnJob) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(job: TryOnJob) {
            binding.tvSavedCategory.text = job.category.displayName.uppercase()
            binding.tvSavedTitle.text = "${job.category.displayName} Fitting"
            binding.tvSavedSubtitle.text = "Saved Virtual Look"

            val displayImage = job.resultImageUrl?.takeIf { it.isNotBlank() } ?: job.personImageUrl
            binding.ivSavedResult.loadMedia(displayImage, "Try-on look")

            binding.root.setOnClickListener {
                onJobClicked(job)
            }
        }
    }

    companion object SavedDiffCallback : DiffUtil.ItemCallback<TryOnJob>() {
        override fun areItemsTheSame(oldItem: TryOnJob, newItem: TryOnJob): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: TryOnJob, newItem: TryOnJob): Boolean = oldItem == newItem
    }
}
