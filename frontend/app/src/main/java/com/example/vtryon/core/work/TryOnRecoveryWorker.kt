package com.example.vtryon.core.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.vtryon.app.TryOnApplication
import com.example.vtryon.core.logging.AppLogger
import com.example.vtryon.data.mapper.toEntity
import com.example.vtryon.data.mapper.toDomain

/**
 * Background WorkManager worker for durable virtual try-on job recovery.
 * Triggered only when the application is backgrounded or killed while a try-on is in-flight.
 */
class TryOnRecoveryWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val app = applicationContext as? TryOnApplication ?: return Result.failure()
        val tryOnDao = app.database.tryOnDao()
        val activeJobEntity = tryOnDao.getLatestActive() ?: return Result.success()

        val jobId = activeJobEntity.publicId
        AppLogger.i("TryOnRecoveryWorker", "Recovering background try-on status for job: $jobId")

        return try {
            val response = app.apiClient.tryOnApi.getTryOn(jobId)
            if (response.isSuccessful) {
                val dto = response.body()?.data
                if (dto != null) {
                    val updatedJob = dto.toDomain()
                    tryOnDao.insert(updatedJob.toEntity())
                    AppLogger.i("TryOnRecoveryWorker", "Job $jobId updated to: ${updatedJob.status.rawValue}")
                }
                Result.success()
            } else {
                Result.retry()
            }
        } catch (exc: Exception) {
            AppLogger.e("TryOnRecoveryWorker", "Error polling background job $jobId", exc)
            Result.retry()
        }
    }

    companion object {
        const val WORK_NAME = "vtryon_active_job_recovery"
    }
}
