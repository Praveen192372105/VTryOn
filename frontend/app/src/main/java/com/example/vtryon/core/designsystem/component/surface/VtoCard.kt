package com.example.vtryon.core.designsystem.component.surface

import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.util.AttributeSet
import android.view.MotionEvent
import android.widget.FrameLayout
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.motion.VtoMotion

/**
 * Editorial card surface with restrained corner radius, subtle borders,
 * outline clipping, and optional tactile press feedback.
 */
open class VtoCard @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val backgroundDrawable = GradientDrawable()

    init {
        clipToOutline = true

        var cornerRadius = context.resources.getDimension(R.dimen.vto_radius_lg)
        var borderWidth = (1 * resources.displayMetrics.density).toInt()
        var borderColor = ContextCompat.getColor(context, R.color.vto_border_default)
        var surfaceColor = ContextCompat.getColor(context, R.color.vto_surface_primary)

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.VtoCard)
            cornerRadius = a.getDimension(R.styleable.VtoCard_vtoCornerRadius, cornerRadius)
            borderWidth = a.getDimensionPixelSize(R.styleable.VtoCard_vtoBorderWidth, borderWidth)
            borderColor = a.getColor(R.styleable.VtoCard_vtoBorderColor, borderColor)
            surfaceColor = a.getColor(R.styleable.VtoCard_vtoSurfaceColor, surfaceColor)
            a.recycle()
        }

        backgroundDrawable.apply {
            this.cornerRadius = cornerRadius
            setColor(surfaceColor)
            setStroke(borderWidth, borderColor)
        }
        background = backgroundDrawable
    }

    fun setCardBorder(widthPx: Int, color: Int) {
        backgroundDrawable.setStroke(widthPx, color)
    }

    fun setCardColor(color: Int) {
        backgroundDrawable.setColor(color)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (!isClickable || !isEnabled) return super.onTouchEvent(event)

        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                animate().scaleX(VtoMotion.PRESS_SCALE)
                    .scaleY(VtoMotion.PRESS_SCALE)
                    .setDuration(VtoMotion.DURATION_INSTANT)
                    .start()
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                animate().scaleX(1.0f)
                    .scaleY(1.0f)
                    .setDuration(VtoMotion.DURATION_INSTANT)
                    .start()
            }
        }
        return super.onTouchEvent(event)
    }
}
