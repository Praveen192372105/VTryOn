package com.example.vtryon.core.designsystem.component.selection

import android.content.Context
import android.util.AttributeSet
import android.view.Gravity
import androidx.appcompat.widget.AppCompatTextView
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.accessibility.VtoAccessibility

/**
 * Custom category and filter chip with high-contrast selected state,
 * tactile press feedback, and TalkBack accessibility.
 */
class VtoChip @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : AppCompatTextView(context, attrs, defStyleAttr) {

    init {
        isClickable = true
        isFocusable = true
        gravity = Gravity.CENTER

        background = ContextCompat.getDrawable(context, R.drawable.vto_bg_chip)
        setTextColor(ContextCompat.getColorStateList(context, R.color.vto_chip_text_selector))
        setTextAppearance(R.style.TextAppearance_VTryOn_LabelMedium)

        val padH = context.resources.getDimensionPixelSize(R.dimen.vto_space_16)
        val padV = context.resources.getDimensionPixelSize(R.dimen.vto_space_8)
        setPadding(padH, padV, padH, padV)
        minHeight = (36 * resources.displayMetrics.density).toInt()

        VtoAccessibility.setButtonRole(this)

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.VtoChip)
            val chipText = a.getString(R.styleable.VtoChip_vtoChipText)
            if (!chipText.isNullOrEmpty()) {
                text = chipText
            }
            val selected = a.getBoolean(R.styleable.VtoChip_vtoChipSelected, false)
            isSelected = selected
            a.recycle()
        }
    }

    fun setChipSelected(selected: Boolean) {
        isSelected = selected
    }
}
