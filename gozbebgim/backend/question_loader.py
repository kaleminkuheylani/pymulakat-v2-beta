# backend/question_loader.py
# ✅ FIX: Sessiz fallback, doğru tablo adı, intermittent error handling

import os
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

# Supabase client'i sadece 1 kere deneyelim
_supabase_attempted = False
_supabase_available = False


def _try_supabase():
    """Supabase client'ı dene — başarısızsa flag set et."""
    global _supabase_attempted, _supabase_available

    if _supabase_attempted:
        return _supabase_available

    _supabase_attempted = True

    # Önce key'lerin varlığını kontrol et
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")

    if not url or not key:
        logger.warning("⚠️ Supabase env vars tanımsız — QUESTIONS fallback kullanılıyor")
        _supabase_available = False
        return False

    # Key çok kısa veya "placeholder" ise atla
    if len(key) < 50 or key.startswith("placeholder") or "..." in key:
        logger.warning("⚠️ Supabase ANON_KEY placeholder gibi görünüyor — fallback")
        _supabase_available = False
        return False

    try:
        from supabase_client import get_supabase
        sb = get_supabase()
        if sb is None:
            _supabase_available = False
            return False
        _supabase_available = True
        return True
    except Exception as e:
        logger.warning(f"⚠️ Supabase client oluşturulamadı: {e}")
        _supabase_available = False
        return False


def load_questions():
    """Soruları yükle — Supabase varsa oradan, yoksa QUESTIONS'tan."""
    from data.QUESTIONS import QUESTIONS

    # Supabase dene
    if _try_supabase():
        try:
            from supabase_client import get_supabase
            sb = get_supabase()
            # ✅ Tablo ismini kontrol et
            # Eğer "interwiews" yoksa "interviews" dene
            for table_name in ["interviews", "interwiews"]:  # eski/yeni isim
                try:
                    response = sb.table(table_name).select("*").limit(1).execute()
                    if response.data is not None:
                        # Tüm verileri çek
                        full_response = sb.table(table_name).select("*").execute()
                        if full_response.data:
                            logger.info(f"✅ {len(full_response.data)} soru Supabase'den yüklendi")
                            return [q_dict for q_dict in full_response.data]
                        break
                except Exception:
                    continue
            else:
                logger.warning("⚠️ 'interviews' tablosu Supabase'de bulunamadı — fallback")
        except Exception as e:
            # ✅ Sessiz fallback — sadece ilk seferde logla
            logger.debug(f"Supabase load error (non-fatal): {e}")

    # Fallback — lokal QUESTIONS
    return QUESTIONS


def filter_questions(
    category: Optional[str] = None,
    level: Optional[str] = None,
    search: Optional[str] = None,
    tag: Optional[str] = None,
):
    """Tüm soruları filtrele (Supabase veya fallback)."""
    all_qs = load_questions()

    result = []
    for q in all_qs:
        if isinstance(q, dict):
            q_dict = q
        else:
            q_dict = {
                "id": getattr(q, "id", None),
                "category": getattr(q, "category", None),
                "level": getattr(q, "level", None),
                "title": getattr(q, "title", ""),
                "description": getattr(q, "description", ""),
                "starter_code": getattr(q, "starter_code", ""),
                "test_cases": getattr(q, "test_cases", []),
                "tags": getattr(q, "tags", []) or [],
            }

        # Category filter
        if category and q_dict.get("category") != category:
            continue

        # Level filter
        if level and q_dict.get("level") != level:
            continue

        # Search filter
        if search:
            s = search.lower()
            if (
                s not in (q_dict.get("title", "") or "").lower()
                and s not in (q_dict.get("description", "") or "").lower()
            ):
                continue

        # Tag filter
        if tag:
            tags = q_dict.get("tags", []) or []
            if tag not in tags:
                continue

        result.append(q)

    return result


def get_question(question_id: int):
    """Tek bir soruyu ID ile getir."""
    all_qs = load_questions()
    for q in all_qs:
        qid = q.get("id") if isinstance(q, dict) else getattr(q, "id", None)
        if qid == question_id:
            return q
    return None
