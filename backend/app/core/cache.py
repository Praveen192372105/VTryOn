"""
V Try-On Core Cache Interface
=============================
Re-exports the centralized caching interface from backend/cache.py
"""

from cache import CacheManager, cache, cached

__all__ = ["CacheManager", "cache", "cached"]
