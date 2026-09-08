package com.example.vtryon.core.designsystem.component.surface

import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.util.AttributeSet
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import androidx.appcompat.widget.AppCompatImageView
import androidx.core.content.ContextCompat
import coil.dispose
import coil.load
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.component.button.VtoIconButton
import com.example.vtryon.core.designsystem.component.feedback.VtoProgressRing
import com.example.vtryon.core.designsystem.icon.VtoIconSize
import com.example.vtryon.core.designsystem.icon.VtoIconTone
import com.example.vtryon.core.designsystem.icon.VtoIconView
import com.example.vtryon.core.designsystem.icon.VtoIcons

/**
 * Editorial fashion media surface supporting aspect ratios, Coil loading,
 * error state fallbacks, restrained selection border, and clean RecyclerView recycling.
 */
class VtoImageCard @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    enum class AspectRatio {
        SQUARE,    // 1:1
        PORTRAIT,  // 3:4
        CINEMATIC  // 16:9
    }

    var aspectRatio: AspectRatio = AspectRatio.PORTRAIT
        set(value) {
            field = value
            requestLayout()
        }

    val imageView = AppCompatImageView(context).apply {
        scaleType = android.widget.ImageView.ScaleType.CENTER_CROP
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    }

    private val loadingIndicator = VtoProgressRing(context).apply {
        setRingColor(ContextCompat.getColor(context, R.color.vto_content_tertiary))
        val size = (24 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(size, size, Gravity.CENTER)
        visibility = GONE
    }

    private val errorIndicator = VtoIconView(context).apply {
        setIcon(com.example.vtryon.core.designsystem.icon.VtoIcon.Warning, VtoIconTone.TERTIARY)
        iconSize = VtoIconSize.LG
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
        visibility = GONE
    }

    val quickActionButton = VtoIconButton(context).apply {
        variant = VtoIconButton.Variant.INVERSE_ON_MEDIA
        val margin = (8 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.TOP or Gravity.END).apply {
            setMargins(0, margin, margin, 0)
        }
        visibility = GONE
    }

    private val selectedBadge = VtoIconView(context).apply {
        setIcon(com.example.vtryon.core.designsystem.icon.VtoIcon.Success, VtoIconTone.PRIMARY)
        iconSize = VtoIconSize.LG
        val margin = (8 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.TOP or Gravity.START).apply {
            setMargins(margin, margin, 0, 0)
        }
        visibility = GONE
    }

    private val borderDrawable = GradientDrawable()
    private var isCardSelected = false

    init {
        clipToOutline = true

        var cornerRadius = context.resources.getDimension(R.dimen.vto_radius_lg)

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.VtoImageCard)
            val ratioOrdinal = a.getInt(R.styleable.VtoImageCard_vtoAspectRatio, 1)
            aspectRatio = AspectRatio.entries.getOrElse(ratioOrdinal) { AspectRatio.PORTRAIT }
            cornerRadius = a.getDimension(R.styleable.VtoImageCard_vtoCornerRadius, cornerRadius)
            val selected = a.getBoolean(R.styleable.VtoImageCard_vtoSelected, false)
            a.recycle()
            setSelectedState(selected)
        }

        borderDrawable.apply {
            this.cornerRadius = cornerRadius
            setColor(ContextCompat.getColor(context, R.color.vto_surface_secondary))
            setStroke(1, ContextCompat.getColor(context, R.color.vto_border_subtle))
        }
        background = borderDrawable

        addView(imageView)
        addView(loadingIndicator)
        addView(errorIndicator)
        addView(quickActionButton)
        addView(selectedBadge)
    }

    fun loadImage(url: String?) {
        if (url.isNullOrEmpty()) {
            showError()
            return
        }

        loadingIndicator.visibility = VISIBLE
        errorIndicator.visibility = GONE

        imageView.load(url) {
            crossfade(180)
            listener(
                onSuccess = { _, _ ->
                    loadingIndicator.visibility = GONE
                    errorIndicator.visibility = GONE
                },
                onError = { _, _ ->
                    showError()
                }
            )
        }
    }

    private fun showError() {
        loadingIndicator.visibility = GONE
        errorIndicator.visibility = VISIBLE
    }

    fun setSelectedState(selected: Boolean) {
        isCardSelected = selected
        selectedBadge.visibility = if (selected) VISIBLE else GONE

        if (selected) {
            borderDrawable.setStroke(
                (2 * resources.displayMetrics.density).toInt(),
                ContextCompat.getColor(context, R.color.vto_border_focus)
            )
        } else {
            borderDrawable.setStroke(
                1,
                ContextCompat.getColor(context, R.color.vto_border_subtle)
            )
        }
    }

    fun isCardSelected(): Boolean = isCardSelected

    fun resetForRecycling() {
        imageView.dispose()
        imageView.setImageDrawable(null)
        setSelectedState(false)
        loadingIndicator.visibility = GONE
        errorIndicator.visibility = GONE
        quickActionButton.visibility = GONE
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val width = MeasureSpec.getSize(widthMeasureSpec)
        val calculatedHeight = when (aspectRatio) {
            AspectRatio.SQUARE -> width
            AspectRatio.PORTRAIT -> (width * 4f / 3f).toInt()
            AspectRatio.CINEMATIC -> (width * 9f / 16f).toInt()
        }
        val customHeightSpec = MeasureSpec.makeMeasureSpec(calculatedHeight, MeasureSpec.EXACTLY)
        super.onMeasure(widthMeasureSpec, customHeightSpec)
    }
}
