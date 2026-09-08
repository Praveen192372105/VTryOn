package com.example.vtryon.feature.auth

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import com.example.vtryon.R
import com.example.vtryon.app.TryOnApplication
import com.example.vtryon.app.navigation.safeNavigate
import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.util.collectWithLifecycle
import com.example.vtryon.databinding.FragmentLoginBinding
import com.example.vtryon.domain.usecase.auth.LoginUseCase

class LoginFragment : Fragment() {

    private var _binding: FragmentLoginBinding? = null
    private val binding get() = _binding!!

    private val viewModel: LoginViewModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val app = requireActivity().application as TryOnApplication
                return LoginViewModel(
                    loginUseCase = LoginUseCase(app.authRepository)
                ) as T
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentLoginBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupListeners()
        observeState()
        observeEffects()
    }

    private fun setupListeners() {
        binding.inputEmail.editText.doAfterTextChanged { text ->
            viewModel.onEvent(LoginUiEvent.EmailChanged(text?.toString().orEmpty()))
        }
        binding.inputPassword.editText.doAfterTextChanged { text ->
            viewModel.onEvent(LoginUiEvent.PasswordChanged(text?.toString().orEmpty()))
        }
        binding.btnLogin.setOnClickListener {
            viewModel.onEvent(LoginUiEvent.LoginClicked)
        }
    }

    private fun observeState() {
        viewModel.uiState.collectWithLifecycle(viewLifecycleOwner) { state ->
            render(state)
        }
    }

    private fun render(state: LoginUiState) {
        binding.btnLogin.setLoading(state.isLoading)
        binding.btnLogin.setText(if (state.isLoading) "Authenticating..." else "Sign In")

        if (state.error != null) {
            binding.tvError.visibility = View.VISIBLE
            binding.tvError.text = when (state.error) {
                is AppError.Unauthorized -> "Invalid email or password. Please try again."
                is AppError.NetworkUnavailable -> "Network unreachable. Check your connection."
                is AppError.Timeout -> "Request timed out. Please try again."
                is AppError.ServerUnavailable -> "Server is temporarily unavailable."
                else -> "Authentication failed. Please try again."
            }
        } else {
            binding.tvError.visibility = View.GONE
        }
    }

    private fun observeEffects() {
        viewModel.effect.collectWithLifecycle(viewLifecycleOwner) { effect ->
            when (effect) {
                is LoginUiEffect.NavigateToWorkspace -> {
                    findNavController().safeNavigate(R.id.action_login_to_workspace)
                }
                is LoginUiEffect.ShowToast -> {
                    Toast.makeText(requireContext(), effect.message, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
