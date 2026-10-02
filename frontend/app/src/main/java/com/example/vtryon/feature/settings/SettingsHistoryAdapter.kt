package com.example.vtryon.feature.settings

import android.content.res.ColorStateList
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.vtryon.R
import com.example.vtryon.databinding.ItemSettingsHistoryBinding
import com.example.vtryon.domain.model.TryOnJob

class SettingsHistoryAdapter(
    private val onJobClicked: (TryOnJob) -> Unit,
    private val onTryAgainClicked: (TryOnJob) -> Unit,
    private val onSaveClicked: (TryOnJob) -> Unit,
    private val onDeleteClicked: (TryOnJob) -> Unit
) : ListAdapter<TryOnJob, SettingsHistoryAdapter.HistoryViewHolder>(HistoryDiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
        val binding = ItemSettingsHistoryBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return HistoryViewHolder(
            binding = binding,
            onJobClicked = onJobClicked,
            onTryAgainClicked = onTryAgainClicked,
            onSaveClicked = onSaveClicked,
            onDeleteClicked = onDeleteClicked
        )
    }

    override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class HistoryViewHolder(
        private val binding: ItemSettingsHistoryBinding,
        private val onJobClicked: (TryOnJob) -> Unit,
        private val onTryAgainClicked: (TryOnJob) -> Unit,
        private val onSaveClicked: (TryOnJob) -> Unit,
        private val onDeleteClicked: (TryOnJob) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(job: TryOnJob) {
            val context = itemView.context

            binding.tvHistoryCategory.text = job.category.displayName.uppercase()
            binding.tvHistoryStatus.text = job.status.rawValue.uppercase()
            binding.tvHistoryTitle.text = "${job.category.displayName} Fitting"
            binding.tvHistorySubtitle.text = if (job.isSaved) "Saved to your looks" else "Fitting Session"

            val displayImage = job.resultImageUrl?.takeIf { it.isNotBlank() }
                ?: job.garmentImageUrl.takeIf { it.isNotBlank() }
                ?: job.personImageUrl
            binding.ivHistoryResult.loadMedia(displayImage, "Fitting result")

            // Saved state styling
            if (job.isSaved) {
                binding.tvSaveLabel.text = "Saved"
                val brandColor = ContextCompat.getColor(context, R.color.vto_brand)
                binding.tvSaveLabel.setTextColor(brandColor)
                binding.ivSaveIcon.imageTintList = ColorStateList.valueOf(brandColor)
            } else {
                binding.tvSaveLabel.text = "Save"
                val normalColor = ContextCompat.getColor(context, R.color.vto_content_primary)
                binding.tvSaveLabel.setTextColor(normalColor)
                binding.ivSaveIcon.imageTintList = ColorStateList.valueOf(normalColor)
            }

            // Click interactions
            binding.root.setOnClickListener {
                onJobClicked(job)
            }

            binding.btnHistoryTryAgain.setOnClickListener {
                onTryAgainClicked(job)
            }

            binding.btnHistorySave.setOnClickListener {
                onSaveClicked(job)
            }

            binding.btnHistoryDelete.setOnClickListener {
                onDeleteClicked(job)
            }
        }
    }

    companion object HistoryDiffCallback : DiffUtil.ItemCallback<TryOnJob>() {
        override fun areItemsTheSame(oldItem: TryOnJob, newItem: TryOnJob): Boolean =
            oldItem.id == newItem.id

        override fun areContentsTheSame(oldItem: TryOnJob, newItem: TryOnJob): Boolean =
            oldItem == newItem
    }
}
