from fastapi import Depends, HTTPException, Header
from backend.supabase_client import get_supabase_admin


async def get_current_user(authorization: str = Header(...)):
    """Bearer <jwt> → Supabase ile doğrula (service_role key ile, RLS bypass)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Geçersiz token formatı.")

    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(401, "Token boş olamaz.")

    sb = get_supabase_admin()

    try:
        # supabase-py v2.x → keyword argümanı gerekli olabilir
        result = sb.auth.get_user(token)
        user = result.user if hasattr(result, "user") else result

        if not user:
            raise HTTPException(401, "Token geçersiz veya süresi dolmuş.")

        return {"id": str(user.id), "email": user.email}
    except HTTPException:
        raise
    except Exception as e:
        # Detaylı log — gerçek hatayı görmek için
        print(f"❌ Token doğrulama hatası: {type(e).__name__}: {e}")
        raise HTTPException(401, f"Token doğrulanamadı: {type(e).__name__}")