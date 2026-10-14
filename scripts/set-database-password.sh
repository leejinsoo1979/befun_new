#!/bin/sh
# 비밀번호만 입력 창으로 받아 Supabase(서울, befun) Session pooler 주소로 DATABASE_URL을 저장한다. 값은 출력하지 않음.
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env.local"
PW=$(osascript -e 'text returned of (display dialog "Supabase befun 프로젝트 만들 때 정한 DB 비밀번호만 입력하세요" default answer "" with hidden answer with title "Befun DB 비밀번호")') || exit 1
ENC=$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$PW")
URL="postgresql://postgres.uqtvwwblhrgfqvufglpm:${ENC}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
node -e '
const fs=require("fs"),f=process.argv[1],url=process.argv[2];
const lines=fs.readFileSync(f,"utf8").split("\n");const out=[];let skip=false;
for(const l of lines){ if(l.startsWith("DATABASE_URL=")){skip=!/^DATABASE_URL="[^"]*"\s*$/.test(l);continue;} if(skip){ if(l.includes("\"")||/^─+$/.test(l.trim())){ if(l.includes("\""))skip=false; continue;} continue;} out.push(l);}
while(out.length&&out[out.length-1]==="")out.pop();
out.push(`DATABASE_URL="${url}"`,"");fs.writeFileSync(f,out.join("\n"));' "$ENV_FILE" "$URL"
echo "저장 완료"
