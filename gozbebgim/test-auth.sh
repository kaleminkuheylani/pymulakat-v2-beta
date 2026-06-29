#!/bin/bash
# Backend auth debug script
# Kullanım: bash test-auth.sh

echo "═══════════════════════════════════════════════"
echo "🔍 Backend Auth Debug"
echo "═══════════════════════════════════════════════"

BASE="http://localhost:8000"

echo ""
echo "1️⃣  Health check:"
curl -s "$BASE/health" | head -c 200
echo ""

echo ""
echo "2️⃣  /auth/me (token'sız, 401 beklenir):"
curl -s -i "$BASE/auth/me" | head -5
echo ""

echo ""
echo "3️⃣  OpenAPI'de auth route'ları:"
curl -s "$BASE/openapi.json" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    paths = data.get('paths', {})
    auth_paths = [p for p in paths if '/auth' in p]
    if auth_paths:
        print('  ✅ Auth route\'ları bulundu:')
        for p in sorted(auth_paths):
            print(f'    - {p}')
    else:
        print('  ❌ HİÇ AUTH ROUTE\'U YOK! Router mount edilmemiş.')
except Exception as e:
    print(f'  ⚠️ OpenAPI parse hatası: {e}')
"

echo ""
echo "═══════════════════════════════════════════════"
echo "📝 Eğer /auth/me 404 dönüyorsa:"
echo "   → main.py'de router include edilmemiş"
echo "   → dependencies.py import hatası var"
echo "   → uvicorn terminalinde traceback'e bak"
echo ""
echo "📝 Eğer /auth/me 401 dönüyorsa:"
echo "   → ✅ Bu NORMAL, token lazım"
echo "   → localStorage'dan token alıp Bearer header'la tekrar dene"
echo ""
echo "📝 Eğer /auth/me 500 dönüyorsa:"
echo "   → Supabase service_role key yanlış veya .env'de yok"
echo "═══════════════════════════════════════════════"