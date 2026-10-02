package com.example.vtryon.feature.saved

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.vtryon.R
import com.example.vtryon.app.TryOnApplication
import com.example.vtryon.app.navigation.safeNavigate
import com.example.vtryon.core.util.collectWithLifecycle
import com.example.vtryon.databinding.FragmentSavedBinding
import com.example.vtryon.domain.usecase.tryon.DeleteTryOnUseCase
import com.example.vtryon.domain.usecase.tryon.GetTryOnHistoryUseCase

class SavedFragment : Fragment() {

    private var _binding: FragmentSavedBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: SavedAdapter

    private val viewModel: SavedViewModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val app = requireActivity().application as TryOnApplication
                return SavedViewModel(
                    getTryOnHistoryUseCase = GetTryOnHistoryUseCase(app.tryOnRepository),
                    deleteTryOnUseCase = DeleteTryOnUseCase(app.tryOnRepository)
                ) as T
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSavedBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = SavedAdapter { job ->
            val bundle = androidx.core.os.bundleOf("jobId" to job.id)
            findNavController().safeNavigate(R.id.action_saved_to_result, bundle)
        }

        binding.rvSaved.layoutManager = LinearLayoutManager(requireContext())
        binding.rvSaved.adapter = adapter

        viewModel.uiState.collectWithLifecycle(viewLifecycleOwner) { state ->
            render(state)
        }
    }

    private fun render(state: SavedUiState) {
        adapter.submitList(state.history)
        if (!state.isLoading && state.history.isEmpty()) {
            binding.emptyView.visibility = View.VISIBLE
            binding.rvSaved.visibility = View.GONE
        } else {
            binding.emptyView.visibility = View.GONE
            binding.rvSaved.visibility = View.VISIBLE
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
