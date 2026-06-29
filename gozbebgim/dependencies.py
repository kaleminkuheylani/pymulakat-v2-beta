"""Re-export from backend/dependencies.py — geriye uyumluluk için.

Asıl implementasyon: backend/dependencies.py
"""
from backend.dependencies import get_current_user, get_optional_user

__all__ = ["get_current_user", "get_optional_user"]
