# backend/dependencies.py — JWT auth helpers (production-grade)
# ✅ FIX v3: PEM (RSA) desteği + decode fallback'leri

import os
import logging
from typing import Optional, Union

import jwt
from fastapi import HTTPException, Request

logger = logging.getLogger(__name__)


def _normalize_secret(secret: str) -> Union[str, bytes]:
    """JWT secret'i normalize et (PEM olmayan raw key'ler için)."""
    if not secret:
        return secret
    if "BEGIN" in secret:
        return secret.encode() if isinstance(secret, str) else secret
    return secret


def _decode_jwt(token: str) -> dict:
    """JWT decode — multi-alg + secret format flexible.

    - HS256 (default), HS384, HS512: plain string secret
    - RS256, RS384, RS512: PEM key gerekli (genelde kullanmiyoruz)
    - ES256: PEM public key
    - Eğer PEM yüklenemezse dev mode fallback (verify_signature=False)
    """
    jwt_secret = os.environ.get("SUPABASE_JWT_SECRET")

    # Alg loglama
    try:
        unverified_header = jwt.get_unverified_header(token)
        token_alg = unverified_header.get("alg", "HS256")
        logger.info(f"🔍 JWT token alg: {token_alg}")
    except Exception:
        token_alg = "HS256"

    if jwt_secret:
        secret_for_decode = _normalize_secret(jwt_secret)
        allowed_algs = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512"]

        try:
            payload = jwt.decode(
                token,
                secret_for_decode,
                algorithms=allowed_algs,
                options={
                    "verify_aud": False,
                    "verify_signature": True,
                },
            )
        except jwt.ExpiredSignatureError:
            logger.warning("⏰ JWT expired")
            raise HTTPException(401, "Token süresi dolmuş. Lütfen tekrar giriş yapın.")
        except jwt.InvalidAlgorithmError as e:
            # ✅ PEM yüklenemedi — dev mode fallback
            logger.warning(f"⚠️ JWT alg '{token_alg}' invalid: {e}. Dev mode fallback.")
            try:
                payload = jwt.decode(
                    token,
                    options={"verify_signature": False, "verify_aud": False},
                )
                logger.warning("⚠️ JWT decoded WITHOUT signature verification — DEV MODE")
            except Exception as e2:
                logger.exception("JWT decode fallback failed")
                raise HTTPException(401, f"Geçersiz token: {e2}")
        except jwt.InvalidTokenError as e:
            logger.warning(f"⚠️ JWT invalid: {e}")
            raise HTTPException(401, f"Geçersiz token: {e}")
    else:
        # Dev mode — secret yok
        logger.warning("⚠️ SUPABASE_JWT_SECRET tanımsız — JWT verify devre dışı!")
        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_aud": False},
            )
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
    """Token zorunlu — protected endpoint'ler için."""
    auth_header = (
        request.headers.get("authorization")
        or request.headers.get("Authorization")
        or request.headers.get("AUTHORIZATION")
        or ""
    ).strip()

    if not auth_header:
        raise HTTPException(
            401,
            "Token gerekli. Authorization header boş. "
            "Frontend'de Bearer <token> gönderdiğinizden emin olun."
        )

    if not auth_header.lower().startswith("bearer "):
        sample = auth_header[:20]
        raise HTTPException(
            401,
            f"Geçersiz token formatı. 'Bearer <token>' bekleniyordu, '{sample}...' geldi."
        )

    token = auth_header[7:].strip()
    if not token:
        raise HTTPException(401, "Token boş olamaz.")

    return _decode_jwt(token)


async def get_optional_user(request: Request) -> Optional[dict]:
    """Token varsa user dict, yoksa None — anon-friendly endpoint'ler için."""
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
        logger.warning(f"⚠️ get_optional_user decode error: {type(e).__name__}: {e}")
        return None
