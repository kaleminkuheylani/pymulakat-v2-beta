# backend/dependencies.py — JWT auth helpers (production-grade)
# Dual-mode: get_current_user (zorunlu) + get_optional_user (anon-friendly)

from fastapi import HTTPException, Request
from typing import Optional
import jwt
import os
import logging

logger = logging.getLogger(__name__)


def _decode_jwt(token: str) -> dict:
    """JWT decode — verify varsa tam, yoksa dev mode."""
    jwt_secret = os.environ.get("SUPABASE_JWT_SECRET")

    if jwt_secret:
        try:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(401, "Token süresi dolmuş.")
        except jwt.InvalidTokenError as e:
            raise HTTPException(401, f"Geçersiz token: {e}")
    else:
        # Dev mode — signature verify YOK
        logger.warning("⚠️ SUPABASE_JWT_SECRET tanımsız — JWT verify devre dışı!")
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
        except Exception as e:
            raise HTTPException(401, f"Token decode edilemedi: {e}")

    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id:
        raise HTTPException(401, "Token'da user bilgisi yok.")
    return {"id": str(user_id), "email": email}


async def get_current_user(request: Request):
    """Token zorunlu — protected endpoint'ler için.

    Raises:
        401: token yok, geçersiz, süresi dolmuş
    """
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(401, "Geçersiz token formatı.")
    token = auth_header.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(401, "Token boş olamaz.")
    return _decode_jwt(token)


async def get_optional_user(request: Request) -> Optional[dict]:
    """Token varsa user dict, yoksa None — anon-friendly endpoint'ler için.

    Raises: HİÇ — token varsa decode et, yoksa None dön.

    Kullanım:
        @router.get("/public-endpoint")
        def handler(user: Optional[dict] = Depends(get_optional_user)):
            if user:
                user["id"]
            else:
                # anonymous
    """
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.replace("Bearer ", "").strip()
    if not token:
        return None
    try:
        return _decode_jwt(token)
    except HTTPException:
        return None
    except Exception:
        return None
