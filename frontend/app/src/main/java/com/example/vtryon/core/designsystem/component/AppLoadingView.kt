package com.example.vtryon.core.designsystem.component

import android.content.Context
import android.util.AttributeSet
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import androidx.appcompat.widget.AppCompatTextView
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.component.feedback.VtoProgressRing

/**
 * Truthful, non-Material loading indicator with contextual processing messages.
 * Never fabricates synthetic percentages.
 */
class AppLoadingView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : LinearLayout(context, attrs, defStyleAttr) {

    private val progressRing = VtoProgressRing(context).apply {
        val size = (36 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(size, size)
    }

    private val titleView = AppCompatTextView(context).apply {
        setTextAppearance(context, R.style.TextAppearance_VTryOn_TitleSmall)
        setTextColor(ContextCompat.getColor(context, R.color.content_primary))
        gravity = Gravity.CENTER
        val marginTop = (16 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = marginTop
        }
    }

    private val detailView = AppCompatTextView(context).apply {
        setTextAppearance(context, R.style.TextAppearance_VTryOn_BodySmall)
        setTextColor(ContextCompat.getColor(context, R.color.content_tertiary))
        gravity = Gravity.CENTER
        val marginTop = (6 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = marginTop
        }
        visibility = View.GONE
    }

    init {
        orientation = VERTICAL
        gravity = Gravity.CENTER
        val padding = (24 * resources.displayMetrics.density).toInt()
        setPadding(padding, padding, padding, padding)

        addView(progressRing)
        addView(titleView)
        addView(detailView)

        setStatus("Loading", null)
    }

    fun setStatus(title: CharSequence, detail: CharSequence? = null) {
        titleView.text = title
        if (!detail.isNullOrEmpty()) {
            detailView.text = detail
            detailView.visibility = View.VISIBLE
        } else {
            detailView.visibility = View.GONE
        }
    }
}
