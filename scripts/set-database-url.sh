#!/bin/sh
# Supabase 접속 주소와 DB 비밀번호를 입력 창으로 받아 .env.local의 DATABASE_URL에 저장한다(값은 화면에 출력하지 않음).
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env.local"
URL=$(osascript -e 'text returned of (display dialog "Supabase에서 복사한 주소를 그대로 붙여넣으세요 (Cmd+V)" default answer "" with title "Befun DB 설정")') || exit 1
PW=$(osascript -e 'text returned of (display dialog "Supabase 프로젝트 만들 때 정한 DB 비밀번호" default answer "" with hidden answer with title "Befun DB 설정")') || exit 1
FINAL=$(printf '%s' "$URL" | sed "s/\[YOUR-PASSWORD\]/$(printf '%s' "$PW" | sed 's/[\/&]/\\&/g')/")
touch "$ENV_FILE"
grep -v '^DATABASE_URL=' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
printf 'DATABASE_URL="%s"\n' "$FINAL" >> "$ENV_FILE"
case "$FINAL" in postgres*://*@*) echo "저장 완료";; *) echo "주소 형식이 이상합니다. 다시 실행해 주세요.";; esac
