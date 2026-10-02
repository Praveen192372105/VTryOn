package com.example.vtryon.core.network

object UrlResolver {
    fun resolveMediaUrl(url: String?): String? {
        if (url.isNullOrBlank()) return url
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://") || url.startsWith("content://")) {
            return url
        }
        val base = ApiClient.DEFAULT_BASE_URL.removeSuffix("/")
        val path = if (url.startsWith("/")) url else "/$url"
        return "$base$path"
    }
}
