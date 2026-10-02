"""
Test Data Repository for VTryOn E2E Automation.
Supplies structured test fixtures, credentials, injection payloads, edge cases,
and route matrices across all 14 testing categories.
"""

# Valid & Test User Personas
VALID_USER = {
    "email": "testuser@vtryon.ai",
    "password": "Password123!",
    "full_name": "Antigravity Test Engineer",
    "role": "standard"
}

ADMIN_USER = {
    "email": "admin@vtryon.ai",
    "password": "AdminSecurePassword2026!",
    "full_name": "System Administrator",
    "role": "admin"
}

LOCKED_USER = {
    "email": "locked@vtryon.ai",
    "password": "Password123!",
    "reason": "Account locked due to excessive failed attempts"
}

UNVERIFIED_USER = {
    "email": "unverified@vtryon.ai",
    "password": "Password123!",
    "status": "pending_verification"
}

# Malformed / Security Payloads
SQL_INJECTION_VECTORS = [
    "' OR '1'='1",
    "admin' --",
    "' UNION SELECT null, username, password FROM users --",
    "'; DROP TABLE users; --",
    "1' OR 1=1 #",
]

XSS_VECTORS = [
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/'/+/onmouseover=1/+/[*/[]/+alert(1)//'>",
    "'\"><script>console.log('xss')</script>",
]

MALFORMED_EMAILS = [
    "plainaddress",
    "#@%^%#$@#$@#.com",
    "@example.com",
    "Joe Smith <email@example.com>",
    "email.example.com",
    "email@example@example.com",
    ".email@example.com",
    "email.@example.com",
    "email..email@example.com",
    "email@example.com (Joe Smith)",
    "email@example",
    "email@-example.com",
    "email@111.222.333.44444",
]

WEAK_PASSWORDS = [
    ("12345", "Too short"),
    ("password", "Common dictionary word"),
    ("qwerty12345", "Predictable keyboard sequence"),
    ("alllowercase", "Missing uppercase, numbers, symbols"),
    ("ALLUPPERCASE", "Missing lowercase, numbers, symbols"),
    ("1234567890", "Only digits"),
    ("!@#$%^&*()", "Only symbols"),
]

# Viewport Breakpoints
BREAKPOINTS = {
    "mobile_portrait": {"width": 375, "height": 812, "name": "iPhone 12/13/14"},
    "mobile_landscape": {"width": 812, "height": 375, "name": "iPhone Landscape"},
    "mobile_small": {"width": 320, "height": 568, "name": "iPhone SE / Small Android"},
    "tablet_portrait": {"width": 768, "height": 1024, "name": "iPad Portrait"},
    "tablet_landscape": {"width": 1024, "height": 768, "name": "iPad Landscape"},
    "laptop": {"width": 1366, "height": 768, "name": "Standard Laptop"},
    "desktop": {"width": 1920, "height": 1080, "name": "FHD Monitor"},
    "ultrawide": {"width": 2560, "height": 1440, "name": "QHD Monitor"},
}

# Routes Under Test (Relative to BASE_URL)
APP_ROUTES = [
    {"name": "Home / Landing", "path": "", "public": True},
    {"name": "Login", "path": "login", "public": True},
    {"name": "Register", "path": "register", "public": True},
    {"name": "How It Works", "path": "how-it-works", "public": True},
    {"name": "Privacy Policy", "path": "privacy", "public": True},
    {"name": "Terms of Service", "path": "terms", "public": True},
    {"name": "Virtual Studio", "path": "app/studio", "public": False},
    {"name": "Outfits Gallery", "path": "app/outfits", "public": False},
    {"name": "Favorites", "path": "app/favorites", "public": False},
    {"name": "Uploads", "path": "app/uploads", "public": False},
    {"name": "Generation History", "path": "app/history", "public": False},
    {"name": "Settings", "path": "app/settings", "public": False},
]

# Supported / Unsupported Upload MIME Types
MIME_TEST_DATA = {
    "valid_png": {"ext": ".png", "mime": "image/png", "max_mb": 10},
    "valid_jpg": {"ext": ".jpg", "mime": "image/jpeg", "max_mb": 10},
    "valid_webp": {"ext": ".webp", "mime": "image/webp", "max_mb": 10},
    "invalid_pdf": {"ext": ".pdf", "mime": "application/pdf"},
    "invalid_exe": {"ext": ".exe", "mime": "application/octet-stream"},
    "invalid_svg": {"ext": ".svg", "mime": "image/svg+xml"},
    "oversized": {"size_mb": 25, "limit_mb": 10},
}
