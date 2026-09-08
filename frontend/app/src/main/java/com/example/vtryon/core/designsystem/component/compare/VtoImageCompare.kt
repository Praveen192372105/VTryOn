package com.example.vtryon.core.designsystem.component.compare

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.drawable.GradientDrawable
import android.util.AttributeSet
import android.view.Gravity
import android.view.MotionEvent
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.accessibility.VtoAccessibility
import com.example.vtryon.core.designsystem.component.selection.VtoSegmentedControl

/**
 * Signature interactive Before/After image comparison view with draggable center divider,
 * zero onDraw allocations, clamped bounds, and accessible TalkBack toggle alternatives.
 */
class VtoImageCompare @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private var originalBitmap: Bitmap? = null
    private var resultBitmap: Bitmap? = null

    // Divider fraction between 0.0 (all result) and 1.0 (all original)
    var dividerPosition: Float = 0.5f
        set(value) {
            field = value.coerceIn(0.0f, 1.0f)
            updateClipBounds()
            invalidate()
        }

    private val dividerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        strokeWidth = 2f * resources.displayMetrics.density
    }

    private val handlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.FILL
    }

    private val handleStrokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0x66000000
        style = Paint.Style.STROKE
        strokeWidth = 1.5f * resources.displayMetrics.density
    }

    // Pre-allocated drawing rects (zero allocations during onDraw)
    private val srcRectOriginal = Rect()
    private val dstRectOriginal = RectF()
    private val srcRectResult = Rect()
    private val dstRectResult = RectF()
    private val dividerRect = RectF()
    private val handleRect = RectF()

    private var isDragging = false
    private val handleRadiusPx = 18f * resources.displayMetrics.density

    // Badges
    private val originalBadge = TextView(context).apply {
        text = "ORIGINAL"
        setTextAppearance(R.style.TextAppearance_VTryOn_Metadata)
        setTextColor(Color.WHITE)
        val padH = (8 * resources.displayMetrics.density).toInt()
        val padV = (4 * resources.displayMetrics.density).toInt()
        setPadding(padH, padV, padH, padV)
        background = GradientDrawable().apply {
            cornerRadius = 4f * resources.displayMetrics.density
            setColor(0x80000000.toInt())
        }
        val margin = (12 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.TOP or Gravity.START).apply {
            setMargins(margin, margin, 0, 0)
        }
    }

    private val resultBadge = TextView(context).apply {
        text = "TRY-ON"
        setTextAppearance(R.style.TextAppearance_VTryOn_Metadata)
        setTextColor(Color.WHITE)
        val padH = (8 * resources.displayMetrics.density).toInt()
        val padV = (4 * resources.displayMetrics.density).toInt()
        setPadding(padH, padV, padH, padV)
        background = GradientDrawable().apply {
            cornerRadius = 4f * resources.displayMetrics.density
            setColor(0x80000000.toInt())
        }
        val margin = (12 * resources.displayMetrics.density).toInt()
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.TOP or Gravity.END).apply {
            setMargins(0, margin, margin, 0)
        }
    }

    init {
        setWillNotDraw(false)
        clipToOutline = true
        background = ContextCompat.getDrawable(context, R.drawable.vto_bg_card)

        addView(originalBadge)
        addView(resultBadge)

        if (attrs != null) {
            val a = context.obtainStyledAttributes(attrs, R.styleable.VtoImageCompare)
            dividerPosition = a.getFloat(R.styleable.VtoImageCompare_vtoDividerPosition, 0.5f)
            a.recycle()
        }
    }

    fun setBitmaps(original: Bitmap?, result: Bitmap?) {
        this.originalBitmap = original
        this.resultBitmap = result
        updateClipBounds()
        invalidate()
    }

    fun showOriginal() {
        dividerPosition = 1.0f
        VtoAccessibility.announce(this, "Showing original image")
    }

    fun showResult() {
        dividerPosition = 0.0f
        VtoAccessibility.announce(this, "Showing virtual try-on result")
    }

    fun showSplit() {
        dividerPosition = 0.5f
        VtoAccessibility.announce(this, "Showing split comparison")
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        updateClipBounds()
    }

    private fun updateClipBounds() {
        val w = width.toFloat()
        val h = height.toFloat()
        if (w <= 0 || h <= 0) return

        val splitX = w * dividerPosition

        // Destination rect for full result image (underneath)
        dstRectResult.set(0f, 0f, w, h)
        resultBitmap?.let {
            srcRectResult.set(0, 0, it.width, it.height)
        }

        // Destination rect for cropped original image (left of split)
        dstRectOriginal.set(0f, 0f, splitX, h)
        originalBitmap?.let {
            val srcSplitX = (it.width * dividerPosition).toInt()
            srcRectOriginal.set(0, 0, srcSplitX, it.height)
        }

        // Divider line bounds
        val halfStroke = dividerPaint.strokeWidth / 2f
        dividerRect.set(splitX - halfStroke, 0f, splitX + halfStroke, h)

        // Center circular handle bounds
        val centerY = h / 2f
        handleRect.set(
            splitX - handleRadiusPx,
            centerY - handleRadiusPx,
            splitX + handleRadiusPx,
            centerY + handleRadiusPx
        )
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        // 1. Draw result image (base layer)
        resultBitmap?.let { bitmap ->
            canvas.drawBitmap(bitmap, srcRectResult, dstRectResult, null)
        }

        // 2. Draw original image (clipped to left of divider)
        originalBitmap?.let { bitmap ->
            if (dividerPosition > 0f) {
                canvas.drawBitmap(bitmap, srcRectOriginal, dstRectOriginal, null)
            }
        }

        // 3. Draw vertical dividing line
        canvas.drawRect(dividerRect, dividerPaint)

        // 4. Draw center tactile handle
        canvas.drawCircle(dividerRect.centerX(), handleRect.centerY(), handleRadiusPx, handlePaint)
        canvas.drawCircle(dividerRect.centerX(), handleRect.centerY(), handleRadiusPx, handleStrokePaint)

        // Draw grip lines inside handle
        val centerX = dividerRect.centerX()
        val centerY = handleRect.centerY()
        val gripHeight = 6f * resources.displayMetrics.density
        val gripOffset = 3f * resources.displayMetrics.density
        val gripPaint = dividerPaint.apply { strokeWidth = 1.5f * resources.displayMetrics.density; color = Color.DKGRAY }

        canvas.drawLine(centerX - gripOffset, centerY - gripHeight, centerX - gripOffset, centerY + gripHeight, gripPaint)
        canvas.drawLine(centerX + gripOffset, centerY - gripHeight, centerX + gripOffset, centerY + gripHeight, gripPaint)
        dividerPaint.color = Color.WHITE
        dividerPaint.strokeWidth = 2f * resources.displayMetrics.density
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                isDragging = true
                parent?.requestDisallowInterceptTouchEvent(true)
                updateFromTouch(event.x)
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                if (isDragging) {
                    updateFromTouch(event.x)
                    return true
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                isDragging = false
                parent?.requestDisallowInterceptTouchEvent(false)
                return true
            }
        }
        return super.onTouchEvent(event)
    }

    private fun updateFromTouch(x: Float) {
        if (width > 0) {
            dividerPosition = (x / width).coerceIn(0.0f, 1.0f)
        }
    }
}
