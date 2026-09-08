package com.example.vtryon.core.designsystem.component.dialog

import android.app.Dialog
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.fragment.app.DialogFragment
import com.example.vtryon.R
import com.example.vtryon.core.designsystem.component.button.VtoPrimaryButton
import com.example.vtryon.core.designsystem.component.button.VtoSecondaryButton

/**
 * Custom non-Material modal dialog composing VTO button primitives
 * and adhering to the monochrome fashion design language.
 */
class VtoDialogFragment : DialogFragment() {

    var dialogTitle: String? = null
    var dialogMessage: String? = null
    var primaryActionText: String? = null
    var secondaryActionText: String? = null
    var onPrimaryClick: (() -> Unit)? = null
    var onSecondaryClick: (() -> Unit)? = null

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val dialog = super.onCreateDialog(savedInstanceState)
        dialog.window?.apply {
            requestFeature(Window.FEATURE_NO_TITLE)
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
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
            background = ContextCompat.getDrawable(context, R.drawable.vto_bg_dialog)
            val pad = (24 * resources.displayMetrics.density).toInt()
            setPadding(pad, pad, pad, pad)
            layoutParams = ViewGroup.LayoutParams(
                (320 * resources.displayMetrics.density).toInt(),
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        if (!dialogTitle.isNullOrEmpty()) {
            val titleView = TextView(context).apply {
                text = dialogTitle
                setTextAppearance(R.style.TextAppearance_VTryOn_TitleMedium)
                setTextColor(ContextCompat.getColor(context, R.color.vto_content_primary))
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = (8 * resources.displayMetrics.density).toInt()
                }
            }
            root.addView(titleView)
        }

        if (!dialogMessage.isNullOrEmpty()) {
            val messageView = TextView(context).apply {
                text = dialogMessage
                setTextAppearance(R.style.TextAppearance_VTryOn_BodyMedium)
                setTextColor(ContextCompat.getColor(context, R.color.vto_content_secondary))
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = (24 * resources.displayMetrics.density).toInt()
                }
            }
            root.addView(messageView)
        }

        val buttonsContainer = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        if (!primaryActionText.isNullOrEmpty()) {
            val primaryBtn = VtoPrimaryButton(context).apply {
                setText(primaryActionText!!)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                setOnClickListener {
                    dismiss()
                    onPrimaryClick?.invoke()
                }
            }
            buttonsContainer.addView(primaryBtn)
        }

        if (!secondaryActionText.isNullOrEmpty()) {
            val secondaryBtn = VtoSecondaryButton(context).apply {
                setText(secondaryActionText!!)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    topMargin = (10 * resources.displayMetrics.density).toInt()
                }
                setOnClickListener {
                    dismiss()
                    onSecondaryClick?.invoke()
                }
            }
            buttonsContainer.addView(secondaryBtn)
        }

        root.addView(buttonsContainer)
        return root
    }

    companion object {
        fun newInstance(
            title: String,
            message: String,
            primaryText: String,
            secondaryText: String? = null,
            onPrimary: (() -> Unit)? = null,
            onSecondary: (() -> Unit)? = null
        ): VtoDialogFragment {
            return VtoDialogFragment().apply {
                this.dialogTitle = title
                this.dialogMessage = message
                this.primaryActionText = primaryText
                this.secondaryActionText = secondaryText
                this.onPrimaryClick = onPrimary
                this.onSecondaryClick = onSecondary
            }
        }
    }
}
