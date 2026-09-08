package com.example.vtryon.core.designsystem.component

import android.content.Context
import android.text.InputType
import android.text.method.HideReturnsTransformationMethod
import android.text.method.PasswordTransformationMethod
import android.util.AttributeSet
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import androidx.annotation.DrawableRes
import androidx.appcompat.widget.AppCompatEditText
import androidx.appcompat.widget.AppCompatTextView
import androidx.core.content.ContextCompat
import androidx.core.widget.doAfterTextChanged
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.icon.AppIconSize
import com.example.vtryon.core.designsystem.icon.AppIconStyle
import com.example.vtryon.core.designsystem.icon.AppIconView

/**
 * Custom non-Material text input field adhering to monochrome editorial fashion guidelines.
 * Supports label, hint, error messaging, leading Hugeicon, and password toggle.
 */
class AppTextInput @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : LinearLayout(context, attrs, defStyleAttr) {

    private val labelView = AppCompatTextView(context).apply {
        setTextAppearance(context, R.style.TextAppearance_VTryOn_LabelSmall)
        setTextColor(ContextCompat.getColor(context, R.color.content_secondary))
        visibility = View.GONE
        val marginBottom = (6 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            bottomMargin = marginBottom
        }
    }

    private val inputContainer = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        val hPadding = (14 * resources.displayMetrics.density).toInt()
        setPadding(hPadding, 0, hPadding, 0)
        background = ContextCompat.getDrawable(context, R.drawable.bg_input_selector)
        layoutParams = LayoutParams(
            LayoutParams.MATCH_PARENT,
            resources.getDimensionPixelSize(R.dimen.input_height)
        )
    }

    private val leadingIconView = AppIconView(context).apply {
        setIconSize(AppIconSize.MD)
        setIconStyle(AppIconStyle.TERTIARY)
        visibility = View.GONE
        val marginEnd = (10 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            rightMargin = marginEnd
        }
    }

    val editText = AppCompatEditText(context).apply {
        background = null
        setTextAppearance(context, R.style.TextAppearance_VTryOn_BodyMedium)
        setTextColor(ContextCompat.getColor(context, R.color.input_text))
        setHintTextColor(ContextCompat.getColor(context, R.color.input_placeholder))
        isSingleLine = true
        layoutParams = LayoutParams(0, LayoutParams.MATCH_PARENT, 1.0f)
    }

    private val trailingActionView = AppIconView(context).apply {
        setIconSize(AppIconSize.MD)
        setIconStyle(AppIconStyle.TERTIARY)
        visibility = View.GONE
        val marginStart = (10 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            leftMargin = marginStart
        }
        isClickable = true
        isFocusable = true
    }

    private val errorView = AppCompatTextView(context).apply {
        setTextAppearance(context, R.style.TextAppearance_VTryOn_LabelSmall)
        setTextColor(ContextCompat.getColor(context, R.color.state_error))
        visibility = View.GONE
        val marginTop = (4 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = marginTop
        }
    }

    private var isPasswordMode = false
    private var isPasswordVisible = false

    init {
        orientation = VERTICAL

        inputContainer.addView(leadingIconView)
        inputContainer.addView(editText)
        inputContainer.addView(trailingActionView)

        addView(labelView)
        addView(inputContainer)
        addView(errorView)

        editText.setOnFocusChangeListener { _, hasFocus ->
            if (errorView.visibility != View.VISIBLE) {
                inputContainer.isSelected = hasFocus
            }
        }

        editText.doAfterTextChanged {
            if (errorView.visibility == View.VISIBLE) {
                clearError()
            }
        }

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.AppTextInput)
            val label = a.getString(R.styleable.AppTextInput_inputLabel)
            if (!label.isNullOrEmpty()) {
                setLabel(label)
            }

            val hint = a.getString(R.styleable.AppTextInput_inputHint)
            if (!hint.isNullOrEmpty()) {
                setHint(hint)
            }

            val error = a.getString(R.styleable.AppTextInput_inputError)
            if (!error.isNullOrEmpty()) {
                setError(error)
            }

            val leadingRes = a.getResourceId(R.styleable.AppTextInput_inputLeadingIcon, 0)
            if (leadingRes != 0) {
                setLeadingIcon(leadingRes)
            }

            val isPassword = a.getBoolean(R.styleable.AppTextInput_inputIsPassword, false)
            if (isPassword) {
                setPasswordMode(true)
            }
            a.recycle()
        }
    }

    fun setLabel(label: CharSequence?) {
        labelView.text = label
        labelView.visibility = if (label.isNullOrEmpty()) View.GONE else View.VISIBLE
    }

    fun setHint(hint: CharSequence?) {
        editText.hint = hint
    }

    fun setText(text: CharSequence?) {
        editText.setText(text)
    }

    fun getText(): String = editText.text?.toString().orEmpty()

    fun setLeadingIcon(@DrawableRes iconRes: Int?) {
        if (iconRes != null && iconRes != 0) {
            leadingIconView.setHugeicon(iconRes, AppIconStyle.TERTIARY)
            leadingIconView.visibility = View.VISIBLE
        } else {
            leadingIconView.visibility = View.GONE
        }
    }

    fun setError(error: CharSequence?) {
        if (!error.isNullOrEmpty()) {
            errorView.text = error
            errorView.visibility = View.VISIBLE
            inputContainer.background = ContextCompat.getDrawable(context, R.drawable.bg_input_error)
        } else {
            clearError()
        }
    }

    fun clearError() {
        errorView.text = ""
        errorView.visibility = View.GONE
        inputContainer.background = ContextCompat.getDrawable(context, R.drawable.bg_input_selector)
    }

    fun setPasswordMode(enabled: Boolean) {
        this.isPasswordMode = enabled
        if (enabled) {
            editText.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            editText.transformationMethod = PasswordTransformationMethod.getInstance()
            trailingActionView.setHugeicon(R.drawable.vto_huge_view, AppIconStyle.TERTIARY)
            trailingActionView.visibility = View.VISIBLE
            trailingActionView.contentDescription = context.getString(R.string.a11y_show_password)
            trailingActionView.setOnClickListener {
                togglePasswordVisibility()
            }
        } else {
            editText.inputType = InputType.TYPE_CLASS_TEXT
            editText.transformationMethod = null
            trailingActionView.visibility = View.GONE
        }
    }

    private fun togglePasswordVisibility() {
        isPasswordVisible = !isPasswordVisible
        if (isPasswordVisible) {
            editText.transformationMethod = HideReturnsTransformationMethod.getInstance()
            trailingActionView.setHugeicon(R.drawable.vto_huge_view_off_slash, AppIconStyle.PRIMARY)
            trailingActionView.contentDescription = context.getString(R.string.a11y_hide_password)
        } else {
            editText.transformationMethod = PasswordTransformationMethod.getInstance()
            trailingActionView.setHugeicon(R.drawable.vto_huge_view, AppIconStyle.TERTIARY)
            trailingActionView.contentDescription = context.getString(R.string.a11y_show_password)
        }
        editText.setSelection(editText.text?.length ?: 0)
    }
}
