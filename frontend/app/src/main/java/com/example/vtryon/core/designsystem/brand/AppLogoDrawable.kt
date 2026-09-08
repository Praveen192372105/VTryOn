package com.example.vtryon.core.designsystem.brand

import android.content.res.ColorStateList
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.Rect
import android.graphics.drawable.Drawable
import androidx.annotation.ColorInt
import androidx.core.graphics.PathParser
import kotlin.math.min

/**
 * High-performance, resolution-independent Drawable reproducing the exact V Try-On brand logo.
 *
 * Pre-parses the 5 canonical SVG paths once at creation time, and transforms them onto the
 * target Canvas with matrix scaling. Guarantees zero heap allocations during [draw].
 */
class AppLogoDrawable(
    @ColorInt initialColor: Int = Color.BLACK
) : Drawable() {

    private val basePaths: List<Path> = AppLogoConstants.LOGO_PATHS.map { pathString ->
        PathParser.createPathFromPathData(pathString)
    }

    private val scaledPaths: List<Path> = basePaths.map { Path() }
    private val transformMatrix: Matrix = Matrix()

    private val paint: Paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = initialColor
    }

    private var tintList: ColorStateList? = null
    private var intrinsicSizePx: Int = 96 // Default fallback intrinsic size

    @ColorInt
    var logoColor: Int = initialColor
        set(value) {
            if (field != value) {
                field = value
                paint.color = value
                invalidateSelf()
            }
        }

    fun setIntrinsicSize(sizePx: Int) {
        if (intrinsicSizePx != sizePx) {
            intrinsicSizePx = sizePx
            invalidateSelf()
        }
    }

    override fun onBoundsChange(bounds: Rect) {
        super.onBoundsChange(bounds)
        updateTransform(bounds)
    }

    private fun updateTransform(bounds: Rect) {
        val width = bounds.width().toFloat()
        val height = bounds.height().toFloat()
        if (width <= 0f || height <= 0f) return

        val scale = min(
            width / AppLogoConstants.VIEWPORT_WIDTH,
            height / AppLogoConstants.VIEWPORT_HEIGHT
        )

        val scaledWidth = AppLogoConstants.VIEWPORT_WIDTH * scale
        val scaledHeight = AppLogoConstants.VIEWPORT_HEIGHT * scale
        val dx = bounds.left + (width - scaledWidth) / 2f
        val dy = bounds.top + (height - scaledHeight) / 2f

        transformMatrix.reset()
        transformMatrix.postScale(scale, scale)
        transformMatrix.postTranslate(dx, dy)

        for (i in basePaths.indices) {
            basePaths[i].transform(transformMatrix, scaledPaths[i])
        }
    }

    override fun draw(canvas: Canvas) {
        if (bounds.isEmpty) return

        for (path in scaledPaths) {
            canvas.drawPath(path, paint)
        }
    }

    override fun setAlpha(alpha: Int) {
        paint.alpha = alpha
        invalidateSelf()
    }

    override fun setColorFilter(colorFilter: ColorFilter?) {
        paint.colorFilter = colorFilter
        invalidateSelf()
    }

    override fun setTintList(tint: ColorStateList?) {
        tintList = tint
        updateTint()
    }

    override fun onStateChange(state: IntArray): Boolean {
        if (tintList != null) {
            updateTint()
            return true
        }
        return super.onStateChange(state)
    }

    override fun isStateful(): Boolean {
        return tintList?.isStateful == true || super.isStateful()
    }

    private fun updateTint() {
        tintList?.let {
            val color = it.getColorForState(state, logoColor)
            if (color != logoColor) {
                logoColor = color
            }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun getOpacity(): Int = PixelFormat.TRANSLUCENT

    override fun getIntrinsicWidth(): Int = intrinsicSizePx
    override fun getIntrinsicHeight(): Int = intrinsicSizePx
}
