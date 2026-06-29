# backend/dependencies.py — JWT auth helpers (production-grade)
# Dual-mode: get_current_user (zorunlu) + get_optional_user (anon-friendly)
# ✅ FIX: "Geçersiz token formatı" debug-friendly

import os
import logging
from typing import Optional

import jwt
from fastapi import HTTPException, Request

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
            logger.warning("⏰ JWT expired")
            raise HTTPException(401, "Token süresi dolmuş. Lütfen tekrar giriş yapın.")
        except jwt.InvalidTokenError as e:
            logger.warning(f"⚠️ JWT invalid: {e}")
            raise HTTPException(401, f"Geçersiz token: {e}")
    else:
        # Dev mode — signature verify YOK
        logger.warning("⚠️ SUPABASE_JWT_SECRET tanımsız — JWT verify devre dışı!")
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
        except Exception as e:
            logger.warning(f"⚠️ JWT decode error: {e}")
            raise HTTPException(401, f"Token decode edilemedi: {e}")

    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id:
        logger.warning(f"⚠️ JWT has no sub claim: {payload}")
        raise HTTPException(401, "Token'da user bilgisi yok.")
    return {"id": str(user_id), "email": email}


async def get_current_user(request: Request):
    """Token zorunlu — protected endpoint'ler için.

    Returns:
        {"id": user_uuid, "email": email}

    Raises:
        401: token yok, geçersiz, süresi dolmuş, veya user_id sub claim yok.
    """
    # ✅ Header'ı hem küçük hem büyük harfle dene
    auth_header = (
        request.headers.get("authorization")
        or request.headers.get("Authorization")
        or request.headers.get("AUTHORIZATION")
        or ""
    ).strip()

    # ✅ Debug log — token geldi mi, format doğru mu
    has_header = bool(auth_header)
    has_bearer = auth_header.lower().startswith("bearer ")
    logger.info(f"🔐 get_current_user: header={'yes' if has_header else 'NO'}, bearer_prefix={'yes' if has_bearer else 'NO'}")

    if not auth_header:
        raise HTTPException(
            401,
            "Token gerekli. Authorization header boş. "
            "Frontend'de Bearer <token> gönderdiğinizden emin olun."
        )

    if not auth_header.lower().startswith("bearer "):
        # Kullanıcıya ne yapması gerektiğini söyle
        sample = auth_header[:20]
        raise HTTPException(
            401,
            f"Geçersiz token formatı. 'Bearer <token>' bekleniyordu, '{sample}...' geldi."
        )

    token = auth_header[7:].strip()  # "Bearer " = 7 char
    if not token:
        raise HTTPException(401, "Token boş olamaz.")

    # ✅ Token uzunluk kontrolü (debug için)
    if len(token) < 50:
        logger.warning(f"⚠️ Token suspiciously short: {len(token)} chars")

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
    auth_header = (
        request.headers.get("authorization")
        or request.headers.get("Authorization")
        or ""
    ).strip()

    if not auth_header or not auth_header.lower().startswith("bearer "):
        return None

    token = auth_header[7:].strip()
    if not token:
        return None

    try:
        return _decode_jwt(token)
    except HTTPException:
        return None
    except Exception as e:
        logger.warning(f"⚠️ get_optional_user decode error: {e}")
        return None
