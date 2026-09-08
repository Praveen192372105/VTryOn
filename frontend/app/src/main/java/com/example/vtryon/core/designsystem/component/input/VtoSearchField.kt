package com.example.vtryon.core.designsystem.component.input

import android.content.Context
import android.text.Editable
import android.text.TextWatcher
import android.util.AttributeSet
import android.view.Gravity
import android.view.inputmethod.EditorInfo
import android.widget.LinearLayout
import androidx.appcompat.widget.AppCompatEditText
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.icon.VtoIconSize
import com.example.vtryon.core.designsystem.icon.VtoIconTone
import com.example.vtryon.core.designsystem.icon.VtoIconView
import com.example.vtryon.core.designsystem.icon.VtoIcons

/**
 * Dedicated compact fashion search field with leading search Hugeicon,
 * dynamic clear button, and Search IME action.
 */
class VtoSearchField @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : LinearLayout(context, attrs, defStyleAttr) {

    private val searchIcon = VtoIconView(context).apply {
        setIcon(com.example.vtryon.core.designsystem.icon.VtoIcon.Search, VtoIconTone.TERTIARY)
        iconSize = VtoIconSize.SM
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            marginEnd = (10 * resources.displayMetrics.density).toInt()
        }
    }

    val editText = AppCompatEditText(context).apply {
        background = null
        setTextAppearance(R.style.TextAppearance_VTryOn_BodyMedium)
        setTextColor(ContextCompat.getColor(context, R.color.vto_content_primary))
        setHintTextColor(ContextCompat.getColor(context, R.color.vto_content_disabled))
        hint = "Search outfits..."
        imeOptions = EditorInfo.IME_ACTION_SEARCH
        isSingleLine = true
        layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1.0f)
    }

    private val clearIcon = VtoIconView(context).apply {
        setIcon(com.example.vtryon.core.designsystem.icon.VtoIcon.ClearSearch, VtoIconTone.TERTIARY)
        iconSize = VtoIconSize.SM
        visibility = GONE
        isClickable = true
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            marginStart = (8 * resources.displayMetrics.density).toInt()
        }
        setOnClickListener {
            editText.text?.clear()
        }
    }

    var onSearchAction: ((String) -> Unit)? = null
    var onQueryChanged: ((String) -> Unit)? = null

    init {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        background = ContextCompat.getDrawable(context, R.drawable.vto_bg_input)
        minimumHeight = context.resources.getDimensionPixelSize(R.dimen.vto_search_height)

        val padH = (12 * resources.displayMetrics.density).toInt()
        setPadding(padH, 0, padH, 0)

        addView(searchIcon)
        addView(editText)
        addView(clearIcon)

        editText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                val query = s?.toString() ?: ""
                clearIcon.visibility = if (query.isNotEmpty()) VISIBLE else GONE
                onQueryChanged?.invoke(query)
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        editText.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                onSearchAction?.invoke(editText.text?.toString() ?: "")
                true
            } else false
        }

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.VtoSearchField)
            val hint = a.getString(R.styleable.VtoSearchField_vtoSearchHint)
            if (!hint.isNullOrEmpty()) {
                editText.hint = hint
            }
            a.recycle()
        }
    }

    fun getQuery(): String = editText.text?.toString() ?: ""

    fun setQuery(text: String) {
        editText.setText(text)
        editText.setSelection(text.length)
    }
}
