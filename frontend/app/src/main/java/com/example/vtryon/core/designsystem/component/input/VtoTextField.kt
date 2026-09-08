package com.example.vtryon.core.designsystem.component.input

import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.text.InputType
import android.text.method.HideReturnsTransformationMethod
import android.text.method.PasswordTransformationMethod
import android.util.AttributeSet
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView
import androidx.annotation.DrawableRes
import androidx.appcompat.widget.AppCompatEditText
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.icon.VtoIconSize
import com.example.vtryon.core.designsystem.icon.VtoIconTone
import com.example.vtryon.core.designsystem.icon.VtoIconView
import com.example.vtryon.core.designsystem.icon.VtoIcons

/**
 * Editorial fashion form text field supporting labels, error states,
 * leading/trailing Hugeicons, and password reveal with cursor index preservation.
 */
class VtoTextField @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : LinearLayout(context, attrs, defStyleAttr) {

    private val labelView = TextView(context).apply {
        setTextAppearance(R.style.TextAppearance_VTryOn_LabelMedium)
        setTextColor(ContextCompat.getColor(context, R.color.vto_content_secondary))
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            bottomMargin = (6 * resources.displayMetrics.density).toInt()
        }
        visibility = GONE
    }

    private val inputContainer = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        background = ContextCompat.getDrawable(context, R.drawable.vto_bg_input)
        minimumHeight = context.resources.getDimensionPixelSize(R.dimen.vto_input_height)
        val padH = (14 * resources.displayMetrics.density).toInt()
        setPadding(padH, 0, padH, 0)
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
    }

    private val leadingIconView = VtoIconView(context).apply {
        iconSize = VtoIconSize.MD
        iconTone = VtoIconTone.TERTIARY
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            marginEnd = (10 * resources.displayMetrics.density).toInt()
        }
        visibility = GONE
    }

    val editText = AppCompatEditText(context).apply {
        background = null // Remove default Android underline
        setTextAppearance(R.style.TextAppearance_VTryOn_BodyLarge)
        setTextColor(ContextCompat.getColor(context, R.color.vto_content_primary))
        setHintTextColor(ContextCompat.getColor(context, R.color.vto_content_disabled))
        layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1.0f)
        isSingleLine = true
    }

    private val trailingIconView = VtoIconView(context).apply {
        iconSize = VtoIconSize.MD
        iconTone = VtoIconTone.TERTIARY
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            marginStart = (10 * resources.displayMetrics.density).toInt()
        }
        visibility = GONE
    }

    private val helperView = TextView(context).apply {
        setTextAppearance(R.style.TextAppearance_VTryOn_BodySmall)
        setTextColor(ContextCompat.getColor(context, R.color.vto_content_tertiary))
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = (4 * resources.displayMetrics.density).toInt()
        }
        visibility = GONE
    }

    private var isPasswordMode = false
    private var isPasswordVisible = false

    init {
        orientation = VERTICAL

        inputContainer.addView(leadingIconView)
        inputContainer.addView(editText)
        inputContainer.addView(trailingIconView)

        addView(labelView)
        addView(inputContainer)
        addView(helperView)

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.VtoTextField)
            val label = a.getString(R.styleable.VtoTextField_vtoLabel)
            if (!label.isNullOrEmpty()) {
                setLabel(label)
            }
            val hint = a.getString(R.styleable.VtoTextField_vtoHint)
            if (!hint.isNullOrEmpty()) {
                setHint(hint)
            }
            val error = a.getString(R.styleable.VtoTextField_vtoError)
            if (!error.isNullOrEmpty()) {
                setError(error)
            }
            val isPassword = a.getBoolean(R.styleable.VtoTextField_vtoIsPassword, false)
            if (isPassword) {
                setPasswordMode(true)
            }
            val leadingRes = a.getResourceId(R.styleable.VtoTextField_vtoLeadingIcon, 0)
            if (leadingRes != 0) {
                setLeadingIcon(leadingRes)
            }
            val helper = a.getString(R.styleable.VtoTextField_vtoHelperText)
            if (!helper.isNullOrEmpty()) {
                setHelperText(helper)
            }
            a.recycle()
        }
    }

    fun setLabel(text: CharSequence?) {
        if (!text.isNullOrEmpty()) {
            labelView.text = text
            labelView.visibility = VISIBLE
        } else {
            labelView.visibility = GONE
        }
    }

    fun setHint(text: CharSequence?) {
        editText.hint = text
    }

    fun setText(text: CharSequence?) {
        editText.setText(text)
    }

    fun getText(): String = editText.text?.toString() ?: ""

    fun setLeadingIcon(icon: com.example.vtryon.core.designsystem.icon.VtoIcon?) {
        if (icon != null) {
            leadingIconView.setIcon(icon)
            leadingIconView.visibility = VISIBLE
        } else {
            leadingIconView.visibility = GONE
        }
    }

    fun setLeadingIcon(@DrawableRes iconRes: Int?) {
        if (iconRes != null && iconRes != 0) {
            leadingIconView.setImageResource(iconRes)
            leadingIconView.visibility = VISIBLE
        } else {
            leadingIconView.visibility = GONE
        }
    }

    fun setTrailingIcon(icon: com.example.vtryon.core.designsystem.icon.VtoIcon?, onClick: (() -> Unit)? = null) {
        if (icon != null) {
            trailingIconView.setIcon(icon)
            trailingIconView.visibility = VISIBLE
            if (onClick != null) {
                trailingIconView.isClickable = true
                trailingIconView.setOnClickListener { onClick() }
            }
        } else {
            trailingIconView.visibility = GONE
        }
    }

    fun setTrailingIcon(@DrawableRes iconRes: Int?, onClick: (() -> Unit)? = null) {
        if (iconRes != null && iconRes != 0) {
            trailingIconView.setImageResource(iconRes)
            trailingIconView.visibility = VISIBLE
            if (onClick != null) {
                trailingIconView.isClickable = true
                trailingIconView.setOnClickListener { onClick() }
            }
        } else {
            trailingIconView.visibility = GONE
        }
    }

    fun setPasswordMode(enabled: Boolean) {
        isPasswordMode = enabled
        if (enabled) {
            editText.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            editText.transformationMethod = PasswordTransformationMethod.getInstance()
            trailingIconView.setIcon(com.example.vtryon.core.designsystem.icon.VtoIcon.ShowPassword, VtoIconTone.TERTIARY)
            trailingIconView.visibility = VISIBLE
            trailingIconView.isClickable = true
            trailingIconView.setOnClickListener {
                togglePasswordVisibility()
            }
        }
    }

    private fun togglePasswordVisibility() {
        val cursor = editText.selectionEnd
        isPasswordVisible = !isPasswordVisible

        if (isPasswordVisible) {
            editText.transformationMethod = HideReturnsTransformationMethod.getInstance()
            trailingIconView.setIcon(com.example.vtryon.core.designsystem.icon.VtoIcon.HidePassword, VtoIconTone.PRIMARY)
        } else {
            editText.transformationMethod = PasswordTransformationMethod.getInstance()
            trailingIconView.setIcon(com.example.vtryon.core.designsystem.icon.VtoIcon.ShowPassword, VtoIconTone.TERTIARY)
        }
        if (cursor >= 0) {
            editText.setSelection(cursor)
        }
    }

    fun setError(errorText: CharSequence?) {
        if (!errorText.isNullOrEmpty()) {
            helperView.text = errorText
            helperView.setTextColor(ContextCompat.getColor(context, R.color.vto_error))
            helperView.visibility = VISIBLE

            val errorBg = GradientDrawable().apply {
                cornerRadius = context.resources.getDimension(R.dimen.vto_radius_md)
                setColor(ContextCompat.getColor(context, R.color.vto_surface_primary))
                setStroke(
                    (1.5f * resources.displayMetrics.density).toInt(),
                    ContextCompat.getColor(context, R.color.vto_error)
                )
            }
            inputContainer.background = errorBg
        } else {
            helperView.visibility = GONE
            inputContainer.background = ContextCompat.getDrawable(context, R.drawable.vto_bg_input)
        }
    }

    fun setHelperText(text: CharSequence?) {
        if (!text.isNullOrEmpty()) {
            helperView.text = text
            helperView.setTextColor(ContextCompat.getColor(context, R.color.vto_content_tertiary))
            helperView.visibility = VISIBLE
        } else {
            helperView.visibility = GONE
        }
    }
}
