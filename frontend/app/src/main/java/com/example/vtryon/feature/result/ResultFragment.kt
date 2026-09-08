package com.example.vtryon.feature.result

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import com.example.vtryon.R
import com.example.vtryon.app.TryOnApplication
import com.example.vtryon.app.navigation.SessionRouteResolver
import com.example.vtryon.app.navigation.safeNavigate
import com.example.vtryon.core.util.collectWithLifecycle
import com.example.vtryon.databinding.FragmentResultBinding
import com.example.vtryon.domain.model.TryOnStatus
import com.example.vtryon.domain.usecase.tryon.ObserveTryOnUseCase

class ResultFragment : Fragment() {

    private var _binding: FragmentResultBinding? = null
    private val binding get() = _binding!!

    private val viewModel: ResultViewModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val app = requireActivity().application as TryOnApplication
                return ResultViewModel(
                    observeTryOnUseCase = ObserveTryOnUseCase(app.tryOnRepository)
                ) as T
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentResultBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val jobId = arguments?.getString("jobId").orEmpty()
        if (jobId.isNotBlank()) {
            binding.loadingIndicator.visibility = View.VISIBLE
            viewModel.load(jobId)
        }

        binding.resultToolbar.setShowBack(true) {
            findNavController().navigateUp()
        }

        binding.btnDone.setOnClickListener {
            // Forward action: Try Another Look, clearing previous result and returning to studio
            findNavController().safeNavigate(R.id.action_result_to_tryon)
        }

        viewModel.uiState.collectWithLifecycle(viewLifecycleOwner) { state ->
            render(state)
        }
    }

    private fun render(state: ResultUiState) {
        if (state.isLoading) {
            binding.loadingIndicator.visibility = View.VISIBLE
            return
        }
        binding.loadingIndicator.visibility = View.GONE

        val job = state.job
        if (job != null) {
            // Pending/Running Route Guard: If still running, redirect to Processing screen
            val jobRoute = SessionRouteResolver.resolveJobRoute(job.status)
            if (jobRoute == SessionRouteResolver.JobRoute.PROCESSING) {
                val bundle = bundleOf("jobId" to job.id)
                findNavController().safeNavigate(R.id.tryOnProcessingFragment, bundle)
                return
            }

            binding.tvStatus.text = "Status: ${job.status.rawValue.replaceFirstChar { it.uppercase() }}"
            binding.tvJobId.text = "Job ID: ${job.id}"
            if (!job.resultImageUrl.isNullOrBlank()) {
                binding.ivResult.loadMedia(job.resultImageUrl, "Result image")
            }
        } else if (state.error != null) {
            binding.tvStatus.text = "This try-on result is no longer available."
            binding.btnDone.isEnabled = true
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
