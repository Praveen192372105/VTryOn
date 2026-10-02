package com.example.vtryon.domain.usecase

import com.example.vtryon.core.common.error.AppError
import com.example.vtryon.core.common.result.AppResult
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.model.TryOnJob
import com.example.vtryon.domain.model.TryOnStatus
import com.example.vtryon.domain.model.User
import com.example.vtryon.domain.repository.AuthRepository
import com.example.vtryon.domain.repository.TryOnRepository
import com.example.vtryon.domain.usecase.auth.LoginUseCase
import com.example.vtryon.domain.usecase.tryon.CreateTryOnUseCase
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class UseCaseTest {

    private val fakeAuthRepository = object : AuthRepository {
        override suspend fun login(email: String, password: String): AppResult<User> {
            return if (email == "valid@example.com" && password == "correct") {
                AppResult.Success(User("usr_01", email, "Valid User"))
            } else {
                AppResult.Error(AppError.Unauthorized)
            }
        }
        override suspend fun register(name: String, email: String, password: String): AppResult<User> =
            AppResult.Success(User("usr_02", email, name))
        override suspend fun logout(): AppResult<Unit> = AppResult.Success(Unit)
        override suspend fun getCurrentUser(): AppResult<User> = AppResult.Success(User("usr_01", "valid@example.com", "Valid User"))
        override fun observeSession(): Flow<User?> = emptyFlow()
        override fun hasActiveSession(): Boolean = false
    }

    private val fakeTryOnRepository = object : TryOnRepository {
        override suspend fun createTryOn(
            personImageFile: File,
            garmentId: String?,
            customGarmentFile: File?,
            category: OutfitCategory
        ): AppResult<TryOnJob> {
            return AppResult.Success(
                TryOnJob(
                    id = "job_01created",
                    personImageUrl = "http://example.com/person.jpg",
                    garmentImageUrl = garmentId ?: "custom",
                    category = category,
                    status = TryOnStatus.QUEUED
                )
            )
        }
        override fun observeTryOn(id: String): Flow<TryOnJob?> = emptyFlow()
        override suspend fun pollTryOnStatus(id: String): AppResult<TryOnJob> = AppResult.Error(AppError.TryOnFailed)
        override fun observeTryOnHistory(): Flow<List<TryOnJob>> = emptyFlow()
        override suspend fun refreshTryOnHistory(): AppResult<Unit> = AppResult.Success(Unit)
        override suspend fun deleteTryOn(id: String): AppResult<Unit> = AppResult.Success(Unit)
        override suspend fun toggleSaveTryOn(id: String, isSaved: Boolean): AppResult<Unit> = AppResult.Success(Unit)
        override suspend fun getActiveJob(): TryOnJob? = null
        override suspend fun clearActiveJob() {}
    }

    @Test
    fun `LoginUseCase returns Unauthorized error on invalid email`() = runTest {
        val useCase = LoginUseCase(fakeAuthRepository)
        val result = useCase("invalid-email", "password")
        assertTrue(result is AppResult.Error)
        assertEquals(AppError.Unauthorized, (result as AppResult.Error).error)
    }

    @Test
    fun `LoginUseCase returns Success on valid credentials`() = runTest {
        val useCase = LoginUseCase(fakeAuthRepository)
        val result = useCase("valid@example.com", "correct")
        assertTrue(result is AppResult.Success)
        assertEquals("Valid User", (result as AppResult.Success).data.name)
    }

    @Test
    fun `CreateTryOnUseCase returns OutfitNotFound when no outfit or custom garment provided`() = runTest {
        val useCase = CreateTryOnUseCase(fakeTryOnRepository)
        val tempFile = File.createTempFile("test_person_", ".jpg").apply { writeText("fake image bytes") }
        try {
            val result = useCase(
                personImageFile = tempFile,
                garmentId = null,
                customGarmentFile = null,
                category = OutfitCategory.UPPER_BODY
            )
            assertTrue(result is AppResult.Error)
            assertEquals(AppError.OutfitNotFound, (result as AppResult.Error).error)
        } finally {
            tempFile.delete()
        }
    }
}
