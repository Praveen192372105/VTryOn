package com.example.vtryon.core.image

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.media.ExifInterface
import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.core.logging.AppLogger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import kotlin.math.max

/**
 * Background image preprocessing and compression service.
 * Normalizes EXIF rotation, sub-samples large camera photos to avoid OOM,
 * and outputs an optimized temporary JPEG file ready for multipart upload.
 */
class ImageCompressor(private val context: Context) {

    suspend fun compressForUpload(
        imageUri: Uri,
        maxDimensionPx: Int = 1920,
        qualityPercent: Int = 85
    ): AppResult<File> = withContext(Dispatchers.IO) {
        try {
            // 1. Read bounds and EXIF orientation without loading full pixels into RAM
            val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            context.contentResolver.openInputStream(imageUri)?.use { input ->
                BitmapFactory.decodeStream(input, null, options)
            } ?: return@withContext AppResult.Error(AppError.InvalidImage)

            val rawWidth = options.outWidth
            val rawHeight = options.outHeight
            if (rawWidth <= 0 || rawHeight <= 0) {
                return@withContext AppResult.Error(AppError.InvalidImage)
            }

            // 2. Compute sample size to avoid allocating 40MB+ bitmap buffers
            var inSampleSize = 1
            val maxSide = max(rawWidth, rawHeight)
            while ((maxSide / inSampleSize) > maxDimensionPx * 1.5) {
                inSampleSize *= 2
            }

            // 3. Decode sub-sampled bitmap
            val decodeOptions = BitmapFactory.Options().apply {
                this.inSampleSize = inSampleSize
                inPreferredConfig = Bitmap.Config.ARGB_8888
            }

            val decodedBitmap = context.contentResolver.openInputStream(imageUri)?.use { input ->
                BitmapFactory.decodeStream(input, null, decodeOptions)
            } ?: return@withContext AppResult.Error(AppError.InvalidImage)

            // 4. Correct EXIF orientation
            val orientation = getExifOrientation(imageUri)
            val matrix = Matrix()
            when (orientation) {
                ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
                ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
                ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
                ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
                ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
            }

            val rotatedBitmap = if (!matrix.isIdentity) {
                val rotated = Bitmap.createBitmap(
                    decodedBitmap, 0, 0, decodedBitmap.width, decodedBitmap.height, matrix, true
                )
                if (rotated != decodedBitmap) {
                    decodedBitmap.recycle()
                }
                rotated
            } else {
                decodedBitmap
            }

            // 5. Scale to target dimension if still oversized
            val curMax = max(rotatedBitmap.width, rotatedBitmap.height)
            val finalBitmap = if (curMax > maxDimensionPx) {
                val scale = maxDimensionPx.toFloat() / curMax.toFloat()
                val targetW = (rotatedBitmap.width * scale).toInt()
                val targetH = (rotatedBitmap.height * scale).toInt()
                val scaled = Bitmap.createScaledBitmap(rotatedBitmap, targetW, targetH, true)
                if (scaled != rotatedBitmap) {
                    rotatedBitmap.recycle()
                }
                scaled
            } else {
                rotatedBitmap
            }

            // 6. Write out compressed temporary JPEG file
            val tempFile = File.createTempFile("vtryon_upload_", ".jpg", context.cacheDir)
            FileOutputStream(tempFile).use { outStream ->
                finalBitmap.compress(Bitmap.CompressFormat.JPEG, qualityPercent, outStream)
                outStream.flush()
            }
            finalBitmap.recycle()

            AppLogger.d("ImageCompressor", "Compressed upload file: ${tempFile.length() / 1024} KB")
            AppResult.Success(tempFile)

        } catch (oom: OutOfMemoryError) {
            AppLogger.e("ImageCompressor", "OOM during image compression", oom)
            AppResult.Error(AppError.ImageTooLarge)
        } catch (exc: Exception) {
            AppLogger.e("ImageCompressor", "Failed to compress image", exc)
            AppResult.Error(AppError.InvalidImage)
        }
    }

    private fun getExifOrientation(uri: Uri): Int {
        return try {
            context.contentResolver.openInputStream(uri)?.use { input ->
                ExifInterface(input).getAttributeInt(
                    ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_NORMAL
                )
            } ?: ExifInterface.ORIENTATION_NORMAL
        } catch (_: Exception) {
            ExifInterface.ORIENTATION_NORMAL
        }
    }
}
