package com.example.vtryon.data.mapper

import com.example.vtryon.data.remote.auth.dto.TokenResponseDto
import com.example.vtryon.data.remote.auth.dto.UserDto
import com.example.vtryon.domain.model.User

fun TokenResponseDto.toDomain(): User {
    return user.toDomain()
}

fun UserDto.toDomain(): User {
    return User(
        id = publicId,
        email = email,
        name = name,
        avatarUrl = avatarUrl
    )
}
