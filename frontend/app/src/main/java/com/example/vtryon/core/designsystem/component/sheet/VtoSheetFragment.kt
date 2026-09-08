package com.example.vtryon.core.designsystem.component.sheet

import android.app.Dialog
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.fragment.app.DialogFragment
import com.example.vtryon.R

/**
 * Custom bottom-attached sheet built using standard DialogFragment
 * without Material BottomSheetDialog dependencies.
 */
abstract class VtoSheetFragment : DialogFragment() {

    abstract val sheetTitle: String?

    abstract fun onCreateSheetContentView(inflater: LayoutInflater, container: ViewGroup?): View

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val dialog = super.onCreateDialog(savedInstanceState)
        dialog.window?.apply {
            requestFeature(Window.FEATURE_NO_TITLE)
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            setGravity(Gravity.BOTTOM)
            setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT)
            attributes?.windowAnimations = R.style.Animation_Vto_BottomSheet
        }
        return dialog
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val context = requireContext()

        val root = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            background = ContextCompat.getDrawable(context, R.drawable.vto_bg_sheet)
            val pad = (20 * resources.displayMetrics.density).toInt()
            setPadding(pad, (12 * resources.displayMetrics.density).toInt(), pad, pad)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        // Drag handle affordance
        val dragHandle = View(context).apply {
            val handleWidth = (36 * resources.displayMetrics.density).toInt()
            val handleHeight = (4 * resources.displayMetrics.density).toInt()
            layoutParams = LinearLayout.LayoutParams(handleWidth, handleHeight).apply {
                gravity = Gravity.CENTER_HORIZONTAL
                bottomMargin = (16 * resources.displayMetrics.density).toInt()
            }
            background = GradientDrawable().apply {
                cornerRadius = (2 * resources.displayMetrics.density)
                setColor(ContextCompat.getColor(context, R.color.vto_border_strong))
            }
        }
        root.addView(dragHandle)

        if (!sheetTitle.isNullOrEmpty()) {
            val titleView = TextView(context).apply {
                text = sheetTitle
                setTextAppearance(R.style.TextAppearance_VTryOn_TitleMedium)
                setTextColor(ContextCompat.getColor(context, R.color.vto_content_primary))
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = (16 * resources.displayMetrics.density).toInt()
                }
            }
            root.addView(titleView)
        }

        val contentView = onCreateSheetContentView(inflater, root)
        root.addView(contentView)

        return root
    }
}
