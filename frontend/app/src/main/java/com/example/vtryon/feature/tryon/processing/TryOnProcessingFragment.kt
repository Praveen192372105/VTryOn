package com.example.vtryon.feature.tryon.processing

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
import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.databinding.FragmentTryonProcessingBinding
import com.example.vtryon.domain.model.TryOnJob
import com.example.vtryon.domain.model.TryOnStatus
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Dedicated destination for active asynchronous try-on job observation.
 *
 * Responsibilities:
 * - Observes job status using only the lightweight [jobId].
 * - Handles offline status reconciliation without misreporting generation failure.
 * - Pops itself off the back stack upon navigating to Result so pressing Back
 *   from Result never returns to a completed spinner.
 * - Leaves server job running safely if user navigates back.
 */
class TryOnProcessingFragment : Fragment() {

    private var _binding: FragmentTryonProcessingBinding? = null
    private val binding get() = _binding!!

    private var pollingJob: Job? = null
    private var currentJobId: String = ""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTryonProcessingBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        currentJobId = arguments?.getString("jobId").orEmpty()
        binding.tvJobId.text = if (currentJobId.isNotBlank()) "Job ID: $currentJobId" else ""

        setupListeners()
        if (currentJobId.isNotBlank()) {
            startPolling(currentJobId)
        } else {
            showError("Invalid or missing try-on job identifier.")
        }
    }

    private fun setupListeners() {
        binding.processingToolbar.setShowBack(true) {
            findNavController().navigateUp()
        }

        binding.btnReturn.setOnClickListener {
            findNavController().navigateUp()
        }

        binding.btnRetry.setOnClickListener {
            binding.failureContainer.visibility = View.GONE
            binding.progressRing.visibility = View.VISIBLE
            binding.tvStatusTitle.text = "Retrying Status Check"
            if (currentJobId.isNotBlank()) {
                startPolling(currentJobId)
            }
        }
    }

    private fun startPolling(jobId: String) {
        pollingJob?.cancel()
        val app = requireActivity().application as TryOnApplication
        val tryOnRepository = app.tryOnRepository

        pollingJob = viewLifecycleOwner.lifecycleScope.launch {
            while (isActive) {
                when (val result = tryOnRepository.pollTryOnStatus(jobId)) {
                    is AppResult.Success<TryOnJob> -> {
                        val job = result.data
                        when (job.status) {
                            TryOnStatus.QUEUED -> {
                                binding.tvStatusTitle.text = "In GPU Queue"
                                binding.tvStatusSubtitle.text = "Your try-on request is queued on the server."
                            }
                            TryOnStatus.PROCESSING -> {
                                binding.tvStatusTitle.text = "AI Diffusion Running"
                                binding.tvStatusSubtitle.text = "CatVTON model is synthesizing garment drape and warping."
                            }
                            TryOnStatus.COMPLETED -> {
                                // Transition to Result, popping this processing destination
                                val bundle = bundleOf("jobId" to jobId)
                                findNavController().safeNavigate(R.id.action_processing_to_result, bundle)
                                break
                            }
                            TryOnStatus.FAILED -> {
                                showError("AI Try-On generation failed on the server. Please try with another image or outfit.")
                                break
                            }
                        }
                    }
                    is AppResult.Error -> {
                        // Offline or transient error: do NOT report as generation failure
                        if (result.error is AppError.NetworkUnavailable) {
                            binding.tvStatusTitle.text = "Reconnecting..."
                            binding.tvStatusSubtitle.text = "Network connection lost. Waiting to re-establish status check..."
                        }
                    }
                }
                delay(2500)
            }
        }
    }

    private fun showError(message: String) {
        binding.progressRing.visibility = View.GONE
        binding.tvStatusTitle.text = "Generation Issue"
        binding.tvStatusSubtitle.text = ""
        binding.failureContainer.visibility = View.VISIBLE
        binding.tvFailureReason.text = message
    }

    override fun onDestroyView() {
        super.onDestroyView()
        pollingJob?.cancel()
        _binding = null
    }
}
