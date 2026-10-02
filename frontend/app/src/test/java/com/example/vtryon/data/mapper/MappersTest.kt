package com.example.vtryon.data.mapper

import com.example.vtryon.core.database.OutfitEntity
import com.example.vtryon.data.remote.auth.dto.TokenResponseDto
import com.example.vtryon.data.remote.auth.dto.UserDto
import com.example.vtryon.data.remote.outfit.dto.OutfitDto
import com.example.vtryon.data.remote.tryon.dto.TryOnJobResponseDto
import com.example.vtryon.domain.model.OutfitCategory
import com.example.vtryon.domain.model.TryOnStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MappersTest {

    @Test
    fun `AuthMapper maps TokenResponseDto to User correctly`() {
        val dto = TokenResponseDto(
            accessToken = "jwt_token_123",
            expiresIn = 3600,
            user = UserDto(
                id = "usr_01test",
                email = "alice@example.com",
                name = "Alice"
            )
        )
        val user = dto.toDomain()
        assertEquals("usr_01test", user.id)
        assertEquals("alice@example.com", user.email)
        assertEquals("Alice", user.name)
    }

    @Test
    fun `OutfitMapper maps DTO to Domain and Entity round-trip`() {
        val dto = OutfitDto(
            id = "out_01",
            name = "Navy Oxford Shirt",
            category = "upper_body",
            imageUrl = "http://example.com/shirt.jpg",
            description = "A classic cotton shirt",
            isAvailable = true,
            isFavorite = true
        )

        val domain = dto.toDomain()
        assertEquals("out_01", domain.id)
        assertEquals(OutfitCategory.UPPER_BODY, domain.category)
        assertTrue(domain.isFavorite)

        val entity = domain.toEntity()
        assertEquals("out_01", entity.publicId)
        assertEquals("upper_body", entity.category)

        val reconstructed = entity.toDomain()
        assertEquals(domain.id, reconstructed.id)
        assertEquals(domain.name, reconstructed.name)
        assertEquals(domain.category, reconstructed.category)
    }

    @Test
    fun `TryOnMapper maps succeeded status to COMPLETED domain status`() {
        val dto = TryOnJobResponseDto(
            id = "job_01",
            status = "succeeded",
            personUploadId = "upl_01",
            outfitId = "out_01"
        )
        val domain = dto.toDomain()
        assertEquals("job_01", domain.id)
        assertEquals(TryOnStatus.COMPLETED, domain.status)
    }

    @Test
    fun `TryOnMapper maps processing status to PROCESSING domain status`() {
        val dto = TryOnJobResponseDto(
            id = "job_02",
            status = "processing",
            personUploadId = "upl_01",
            outfitId = "out_01"
        )
        val domain = dto.toDomain()
        assertEquals(TryOnStatus.PROCESSING, domain.status)
    }
}
