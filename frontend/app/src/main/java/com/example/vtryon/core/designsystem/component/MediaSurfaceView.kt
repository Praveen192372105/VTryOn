package com.example.vtryon.core.designsystem.component

import android.content.Context
import android.graphics.Outline
import android.util.AttributeSet
import android.view.Gravity
import android.view.View
import android.view.ViewOutlineProvider
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.ProgressBar
import androidx.appcompat.widget.AppCompatImageView
import androidx.core.content.ContextCompat
import coil.load
import coil.request.Disposable
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.icon.AppIconSize
import com.example.vtryon.core.designsystem.icon.AppIconStyle
import com.example.vtryon.core.designsystem.icon.AppIconView

/**
 * Editorial Image Surface with aspect ratio enforcement, rounded corner clipping,
 * Coil asynchronous loading, progress skeleton, and error states.
 */
class MediaSurfaceView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    enum class AspectRatio(val ratio: Float) {
        SQUARE(1.0f),
        PORTRAIT(4f / 3f), // Height = Width * 4 / 3 (standard 3:4 fashion format)
        CINEMATIC(9f / 16f),
        FREE(0f)
    }

    val imageView = AppCompatImageView(context).apply {
        scaleType = ImageView.ScaleType.CENTER_CROP
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    }

    private val loadingIndicator = ProgressBar(context, null, android.R.attr.progressBarStyleSmall).apply {
        visibility = View.GONE
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
    }

    private val errorContainer = FrameLayout(context).apply {
        visibility = View.GONE
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        setBackgroundColor(ContextCompat.getColor(context, R.color.surface_secondary))

        val errorIcon = AppIconView(context).apply {
            setHugeicon(R.drawable.vto_huge_alert_circle, AppIconStyle.TERTIARY)
            setIconSize(AppIconSize.LG)
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
        }
        addView(errorIcon)
    }

    private var aspectRatio: AspectRatio = AspectRatio.PORTRAIT
    private var cornerRadiusPx: Float = 0f
    private var currentDisposable: Disposable? = null

    init {
        background = ContextCompat.getDrawable(context, R.drawable.bg_surface_card)
        clipToOutline = true

        addView(imageView)
        addView(loadingIndicator)
        addView(errorContainer)

        cornerRadiusPx = resources.getDimension(R.dimen.radius_md)

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.MediaSurfaceView)
            val ratioOrdinal = a.getInt(R.styleable.MediaSurfaceView_mediaAspectRatio, 1)
            aspectRatio = AspectRatio.entries.getOrElse(ratioOrdinal) { AspectRatio.PORTRAIT }

            val scaleTypeOrdinal = a.getInt(R.styleable.MediaSurfaceView_mediaScaleType, 0)
            imageView.scaleType = when (scaleTypeOrdinal) {
                1 -> ImageView.ScaleType.FIT_CENTER
                2 -> ImageView.ScaleType.CENTER_INSIDE
                else -> ImageView.ScaleType.CENTER_CROP
            }

            cornerRadiusPx = a.getDimension(R.styleable.MediaSurfaceView_mediaCornerRadius, cornerRadiusPx)
            a.recycle()
        }

        applyCornerRadius(cornerRadiusPx)
    }

    fun setAspectRatio(ratio: AspectRatio) {
        this.aspectRatio = ratio
        requestLayout()
    }

    fun setScaleType(scaleType: ImageView.ScaleType) {
        imageView.scaleType = scaleType
    }

    fun applyCornerRadius(radiusPx: Float) {
        this.cornerRadiusPx = radiusPx
        outlineProvider = object : ViewOutlineProvider() {
            override fun getOutline(view: View, outline: Outline) {
                outline.setRoundRect(0, 0, view.width, view.height, cornerRadiusPx)
            }
        }
        invalidateOutline()
    }

    fun loadMedia(data: Any?, contentDescription: String? = null, onRetry: (() -> Unit)? = null) {
        currentDisposable?.dispose()
        imageView.contentDescription = contentDescription
        loadingIndicator.visibility = View.VISIBLE
        errorContainer.visibility = View.GONE

        val resolvedData = if (data is String) {
            com.example.vtryon.core.network.UrlResolver.resolveMediaUrl(data)
        } else {
            data
        }

        currentDisposable = imageView.load(resolvedData) {
            crossfade(true)
            listener(
                onStart = {
                    loadingIndicator.visibility = View.VISIBLE
                    errorContainer.visibility = View.GONE
                },
                onSuccess = { _, _ ->
                    loadingIndicator.visibility = View.GONE
                    errorContainer.visibility = View.GONE
                },
                onError = { _, _ ->
                    loadingIndicator.visibility = View.GONE
                    errorContainer.visibility = View.VISIBLE
                    if (onRetry != null) {
                        errorContainer.setOnClickListener {
                            loadMedia(data, contentDescription, onRetry)
                            onRetry()
                        }
                    }
                }
            )
        }
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val heightMode = MeasureSpec.getMode(heightMeasureSpec)
        val heightSize = MeasureSpec.getSize(heightMeasureSpec)

        if (aspectRatio == AspectRatio.FREE || (heightMode == MeasureSpec.EXACTLY && heightSize > 0)) {
            super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        } else {
            val width = MeasureSpec.getSize(widthMeasureSpec)
            val calculatedHeight = (width * aspectRatio.ratio).toInt()
            val finalHeightSpec = MeasureSpec.makeMeasureSpec(calculatedHeight, MeasureSpec.EXACTLY)
            super.onMeasure(widthMeasureSpec, finalHeightSpec)
        }
    }
}
