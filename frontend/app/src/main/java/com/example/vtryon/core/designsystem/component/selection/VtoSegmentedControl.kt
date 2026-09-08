package com.example.vtryon.core.designsystem.component.selection

import android.content.Context
import android.util.AttributeSet
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.accessibility.VtoAccessibility

/**
 * Editorial segmented switch with high-contrast tab states and TalkBack support.
 */
class VtoSegmentedControl @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : LinearLayout(context, attrs, defStyleAttr) {

    private val segments = mutableListOf<String>()
    var selectedIndex = 0
        private set

    var onSegmentSelectedListener: ((Int, String) -> Unit)? = null

    init {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        background = ContextCompat.getDrawable(context, R.drawable.vto_bg_segmented_track)
        val pad = (3 * resources.displayMetrics.density).toInt()
        setPadding(pad, pad, pad, pad)
        minimumHeight = (40 * resources.displayMetrics.density).toInt()
    }

    fun setSegments(items: List<String>, defaultIndex: Int = 0) {
        segments.clear()
        segments.addAll(items)
        removeAllViews()

        items.forEachIndexed { index, title ->
            val tabView = TextView(context).apply {
                text = title
                setTextAppearance(R.style.TextAppearance_VTryOn_LabelMedium)
                gravity = Gravity.CENTER
                isClickable = true
                isFocusable = true
                val padH = (12 * resources.displayMetrics.density).toInt()
                val padV = (6 * resources.displayMetrics.density).toInt()
                setPadding(padH, padV, padH, padV)
                layoutParams = LayoutParams(0, LayoutParams.MATCH_PARENT, 1.0f)
                setOnClickListener {
                    selectIndex(index, notify = true)
                }
            }
            VtoAccessibility.setButtonRole(tabView)
            addView(tabView)
        }
        selectIndex(defaultIndex, notify = false)
    }

    fun selectIndex(index: Int, notify: Boolean = true) {
        if (index !in 0 until childCount) return
        selectedIndex = index

        for (i in 0 until childCount) {
            val child = getChildAt(i) as? TextView ?: continue
            val isSelected = (i == index)
            child.isSelected = isSelected

            if (isSelected) {
                child.background = ContextCompat.getDrawable(context, R.drawable.vto_bg_segmented_thumb)
                child.setTextColor(ContextCompat.getColor(context, R.color.vto_content_primary))
                child.animate().scaleX(1.02f).scaleY(1.02f).setDuration(120).start()
            } else {
                child.background = null
                child.setTextColor(ContextCompat.getColor(context, R.color.vto_content_secondary))
                child.animate().scaleX(1.0f).scaleY(1.0f).setDuration(120).start()
            }
        }

        if (notify && index in segments.indices) {
            onSegmentSelectedListener?.invoke(index, segments[index])
            VtoAccessibility.announce(this, "${segments[index]} selected")
        }
    }
}
