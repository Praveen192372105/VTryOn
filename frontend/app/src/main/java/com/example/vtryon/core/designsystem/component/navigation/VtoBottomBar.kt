package com.example.vtryon.core.designsystem.component.navigation

import android.content.Context
import android.util.AttributeSet
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView
import androidx.annotation.DrawableRes
import androidx.core.content.ContextCompat
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.icon.VtoIconSize
import com.example.vtryon.core.designsystem.icon.VtoIconTone
import com.example.vtryon.core.designsystem.icon.VtoIconView
import com.example.vtryon.core.designsystem.icon.VtoIcons

/**
 * Custom non-Material bottom navigation surface with tactile selection feedback,
 * top-border separation, and safe area inset compliance.
 */
class VtoBottomBar @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : LinearLayout(context, attrs, defStyleAttr) {

    data class Item(
        val id: Int,
        val icon: com.example.vtryon.core.designsystem.icon.VtoIcon,
        val label: String
    ) {
        val iconRes: Int get() = icon.drawableRes

        constructor(id: Int, @DrawableRes iconRes: Int, label: String) : this(
            id = id,
            icon = com.example.vtryon.core.designsystem.icon.VtoIcon.Custom(iconRes),
            label = label
        )
    }

    private val items = mutableListOf<Item>()
    private var selectedIndex = 0
    var onItemSelectedListener: ((Int, Item) -> Unit)? = null

    init {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        background = ContextCompat.getDrawable(context, R.color.vto_surface_primary)
        minimumHeight = context.resources.getDimensionPixelSize(R.dimen.vto_bottom_bar_height)

        // Default top-level destinations
        setItems(
            listOf(
                Item(0, com.example.vtryon.core.designsystem.icon.VtoIcon.Home, "Home"),
                Item(1, com.example.vtryon.core.designsystem.icon.VtoIcon.TryOn, "Try-On"),
                Item(2, com.example.vtryon.core.designsystem.icon.VtoIcon.Saved, "Saved")
            )
        )
    }

    fun setItems(newItems: List<Item>) {
        items.clear()
        items.addAll(newItems)
        removeAllViews()

        items.forEachIndexed { index, item ->
            val itemView = createItemView(index, item)
            addView(itemView)
        }
        selectTab(selectedIndex, notify = false)
    }

    fun setSelectedDestination(id: Int) {
        val index = items.indexOfFirst { it.id == id }
        if (index >= 0) {
            selectTab(index, notify = false)
        }
    }

    private fun createItemView(index: Int, item: Item): LinearLayout {
        return LinearLayout(context).apply {
            orientation = VERTICAL
            gravity = Gravity.CENTER
            layoutParams = LayoutParams(0, LayoutParams.MATCH_PARENT, 1.0f)
            isClickable = true
            isFocusable = true
            contentDescription = item.label

            val iconView = VtoIconView(context).apply {
                tag = "icon"
                iconSize = VtoIconSize.LG
                setIcon(item.icon)
            }

            val textView = TextView(context).apply {
                tag = "text"
                setTextAppearance(R.style.TextAppearance_VTryOn_LabelSmall)
                text = item.label
                layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
                    topMargin = (3 * resources.displayMetrics.density).toInt()
                }
            }

            addView(iconView)
            addView(textView)

            setOnClickListener {
                selectTab(index, notify = true)
            }
        }
    }

    fun selectTab(index: Int, notify: Boolean = true) {
        if (index !in 0 until childCount) return
        selectedIndex = index

        for (i in 0 until childCount) {
            val child = getChildAt(i) as? LinearLayout ?: continue
            val isSelected = (i == index)
            val iconView = child.findViewWithTag<VtoIconView>("icon")
            val textView = child.findViewWithTag<TextView>("text")

            child.isSelected = isSelected
            if (isSelected) {
                iconView?.iconTone = VtoIconTone.PRIMARY
                textView?.setTextColor(ContextCompat.getColor(context, R.color.vto_content_primary))
                textView?.setTextAppearance(R.style.TextAppearance_VTryOn_LabelSmall)
                child.animate().scaleX(1.05f).scaleY(1.05f).setDuration(120).start()
            } else {
                iconView?.iconTone = VtoIconTone.TERTIARY
                textView?.setTextColor(ContextCompat.getColor(context, R.color.vto_content_tertiary))
                child.animate().scaleX(1.0f).scaleY(1.0f).setDuration(120).start()
            }
        }

        if (notify && index in items.indices) {
            onItemSelectedListener?.invoke(items[index].id, items[index])
        }
    }
}
