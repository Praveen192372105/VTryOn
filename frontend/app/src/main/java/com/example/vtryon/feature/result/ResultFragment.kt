package com.example.vtryon.feature.result

import android.content.ContentValues
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import coil.imageLoader
import coil.request.ImageRequest
import coil.request.SuccessResult
import com.example.vtryon.R
import com.example.vtryon.app.TryOnApplication
import com.example.vtryon.app.navigation.SessionRouteResolver
import com.example.vtryon.app.navigation.safeNavigate
import com.example.vtryon.core.designsystem.component.AppButton
import com.example.vtryon.core.util.collectWithLifecycle
import com.example.vtryon.databinding.FragmentResultBinding
import com.example.vtryon.domain.model.TryOnStatus
import com.example.vtryon.domain.usecase.tryon.ObserveTryOnUseCase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import timber.log.Timber

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
            // Forward action: Return to studio to try another look
            if (!findNavController().popBackStack(R.id.tryOnFragment, false)) {
                findNavController().safeNavigate(R.id.action_result_to_tryon)
            }
        }

        binding.emptyStateView.setAction("Back to Studio") {
            if (!findNavController().popBackStack(R.id.tryOnFragment, false)) {
                findNavController().safeNavigate(R.id.action_result_to_tryon)
            }
        }

        viewModel.uiState.collectWithLifecycle(viewLifecycleOwner) { state ->
            render(state)
        }
    }

    private fun render(state: ResultUiState) {
        if (state.isLoading) {
            binding.loadingIndicator.visibility = View.VISIBLE
            binding.layoutResultSuccess.visibility = View.GONE
            binding.emptyStateView.visibility = View.GONE
            return
        }
        binding.loadingIndicator.visibility = View.GONE

        val job = state.job
        if (job == null) {
            // No result found or removed
            binding.layoutResultSuccess.visibility = View.GONE
            binding.emptyStateView.visibility = View.VISIBLE
            binding.emptyStateView.setTitle("Look Not Found")
            binding.emptyStateView.setDescription("This virtual fitting session is no longer available or may have expired.")
            binding.btnDownload.visibility = View.GONE
            binding.btnDone.setText("Back to Studio")
            binding.btnDone.setVariant(AppButton.Variant.PRIMARY)
            return
        }

        // Pending/Running Route Guard: If still running, redirect to Processing screen
        val jobRoute = SessionRouteResolver.resolveJobRoute(job.status)
        if (jobRoute == SessionRouteResolver.JobRoute.PROCESSING) {
            val bundle = bundleOf("jobId" to job.id)
            findNavController().safeNavigate(R.id.tryOnProcessingFragment, bundle)
            return
        }

        if (job.status == TryOnStatus.FAILED || job.resultImageUrl.isNullOrBlank()) {
            // Failed fitting state
            binding.layoutResultSuccess.visibility = View.GONE
            binding.emptyStateView.visibility = View.VISIBLE
            binding.emptyStateView.setTitle("Fitting Could Not Complete")
            val errorMsg = job.failureReason?.ifBlank { null }
                ?: "The virtual fitting could not be completed. Please try another outfit or portrait."
            binding.emptyStateView.setDescription(errorMsg)
            binding.btnDownload.visibility = View.GONE
            binding.btnDone.setText("Try Again")
            binding.btnDone.setVariant(AppButton.Variant.PRIMARY)
        } else {
            // Successful generated look
            binding.emptyStateView.visibility = View.GONE
            binding.layoutResultSuccess.visibility = View.VISIBLE
            binding.tvStatus.text = "Your Look is Ready"
            binding.tvSubtitle.text = "Virtual fitting completed for ${job.category.displayName}"
            binding.ivResult.loadMedia(job.resultImageUrl, "Result image")

            binding.btnDownload.visibility = View.VISIBLE
            binding.btnDownload.setText("Download Look")
            binding.btnDownload.setVariant(AppButton.Variant.PRIMARY)
            binding.btnDownload.setOnClickListener {
                downloadLook(job.resultImageUrl)
            }

            binding.btnDone.setText("Try Another")
            binding.btnDone.setVariant(AppButton.Variant.SECONDARY)
        }
    }

    private fun downloadLook(imageUrl: String?) {
        if (imageUrl.isNullOrBlank()) {
            context?.let { Toast.makeText(it, "Image not available to download", Toast.LENGTH_SHORT).show() }
            return
        }

        binding.btnDownload.setLoading(true)
        val resolvedUrl = com.example.vtryon.core.network.UrlResolver.resolveMediaUrl(imageUrl)

        viewLifecycleOwner.lifecycleScope.launch(Dispatchers.IO) {
            try {
                val request = ImageRequest.Builder(requireContext())
                    .data(resolvedUrl)
                    .build()
                val result = requireContext().imageLoader.execute(request)
                if (result is SuccessResult) {
                    val drawable = result.drawable
                    val bitmap = (drawable as? BitmapDrawable)?.bitmap ?: run {
                        val bmp = Bitmap.createBitmap(
                            drawable.intrinsicWidth.coerceAtLeast(1),
                            drawable.intrinsicHeight.coerceAtLeast(1),
                            Bitmap.Config.ARGB_8888
                        )
                        val canvas = Canvas(bmp)
                        drawable.setBounds(0, 0, canvas.width, canvas.height)
                        drawable.draw(canvas)
                        bmp
                    }

                    val filename = "VTO_Look_${System.currentTimeMillis()}.jpg"
                    val contentValues = ContentValues().apply {
                        put(MediaStore.Images.Media.DISPLAY_NAME, filename)
                        put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            put(
                                MediaStore.Images.Media.RELATIVE_PATH,
                                Environment.DIRECTORY_PICTURES + "/VTryOn"
                            )
                            put(MediaStore.Images.Media.IS_PENDING, 1)
                        }
                    }

                    val resolver = requireContext().contentResolver
                    val uri = resolver.insert(
                        MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                        contentValues
                    )

                    if (uri != null) {
                        resolver.openOutputStream(uri)?.use { outStream ->
                            bitmap.compress(Bitmap.CompressFormat.JPEG, 95, outStream)
                        }
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            contentValues.clear()
                            contentValues.put(MediaStore.Images.Media.IS_PENDING, 0)
                            resolver.update(uri, contentValues, null, null)
                        }
                        withContext(Dispatchers.Main) {
                            binding.btnDownload.setLoading(false)
                            Toast.makeText(requireContext(), "Look saved to gallery", Toast.LENGTH_SHORT).show()
                        }
                    } else {
                        withContext(Dispatchers.Main) {
                            binding.btnDownload.setLoading(false)
                            Toast.makeText(requireContext(), "Failed to save look", Toast.LENGTH_SHORT).show()
                        }
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        binding.btnDownload.setLoading(false)
                        Toast.makeText(requireContext(), "Failed to load image for download", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Timber.e(e, "Error saving look image")
                withContext(Dispatchers.Main) {
                    binding.btnDownload.setLoading(false)
                    Toast.makeText(requireContext(), "Error saving image: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
