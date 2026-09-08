package com.example.vtryon.domain.model

/**
 * Clean domain representation of an authenticated user.
 * Independent of network DTOs or database entities.
 */
data class User(
    val id: String,
    val email: String,
    val name: String,
    val avatarUrl: String? = null
)
