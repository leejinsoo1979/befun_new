#!/bin/sh
# 구글·카카오·네이버 로그인 키를 입력 창으로 받아 .env.local에 저장한다(값은 출력하지 않음).
# 각 단계: 개발자 사이트 열기 → 붙여넣을 주소를 클립보드에 복사 → 안내 → 키 입력 창.
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env.local"
BASE="http://localhost:3003"

save() { # save NAME VALUE
  node -e '
const fs=require("fs"),[f,k,v]=process.argv.slice(1);
const lines=fs.existsSync(f)?fs.readFileSync(f,"utf8").split("\n").filter(l=>!l.startsWith(k+"=")):[];
while(lines.length&&lines[lines.length-1]==="")lines.pop();
lines.push(`${k}="${v}"`,"");fs.writeFileSync(f,lines.join("\n"));' "$ENV_FILE" "$1" "$2"
}
ask() { # ask TITLE MESSAGE [hidden]
  if [ "$3" = hidden ]; then H="with hidden answer"; else H=""; fi
  osascript -e "text returned of (display dialog \"$2\" default answer \"\" $H with title \"$1\" giving up after 3600)" 2>/dev/null
}
step() { # step TITLE URL REDIRECT GUIDE
  printf '%s' "$3" | pbcopy
  open "$2"
  osascript -e "button returned of (display dialog \"$4\" buttons {\"건너뛰기\", \"키 입력하기\"} default button 2 with title \"$1\" giving up after 3600)" 2>/dev/null
}

save NEXTAUTH_URL "$BASE"
# 인자로 일부만 실행 가능: sh set-social-keys.sh naver kakao (생략 시 전체)
want() { [ -z "$ONLY" ] && return 0; case " $ONLY " in *" $1 "*) return 0;; esac; return 1; }
ONLY="$*"

if want google; then R=$(step "1/3 구글 로그인" "https://console.cloud.google.com/apis/credentials/oauthclient" "$BASE/api/auth/callback/google" "브라우저에 구글 클라우드가 열렸어요.

1) 애플리케이션 유형: 웹 애플리케이션
2) 승인된 리디렉션 URI → URI 추가 → Cmd+V (주소가 이미 복사돼 있어요)
3) 만들기 → 나오는 '클라이언트 ID'와 '클라이언트 보안 비밀번호'를 준비

(처음이면 'OAuth 동의 화면'을 먼저 만들라고 나와요. 앱 이름 befun, 이메일만 넣고 저장하면 돼요.)")
if [ "$R" = "키 입력하기" ]; then
  V=$(ask "구글" "클라이언트 ID를 붙여넣으세요"); [ -n "$V" ] && save GOOGLE_CLIENT_ID "$V"
  V=$(ask "구글" "클라이언트 보안 비밀번호를 붙여넣으세요" hidden); [ -n "$V" ] && save GOOGLE_CLIENT_SECRET "$V"
fi; fi

if want kakao; then R=$(step "2/3 카카오 로그인" "https://developers.kakao.com/console/app" "$BASE/api/auth/callback/kakao" "브라우저에 카카오 개발자 콘솔이 열렸어요.

1) 애플리케이션 추가하기 → 앱 이름 befun → 저장
2) 앱 키 → 'REST API 키' 준비
3) 카카오 로그인 → 활성화 ON → Redirect URI 등록 → Cmd+V (주소가 이미 복사돼 있어요)
4) 카카오 로그인 → 보안 → Client Secret 코드 생성 → 활성화 → 코드 준비")
if [ "$R" = "키 입력하기" ]; then
  V=$(ask "카카오" "REST API 키를 붙여넣으세요"); [ -n "$V" ] && save KAKAO_CLIENT_ID "$V"
  V=$(ask "카카오" "Client Secret 코드를 붙여넣으세요" hidden); [ -n "$V" ] && save KAKAO_CLIENT_SECRET "$V"
fi; fi

if want naver; then R=$(step "3/3 네이버 로그인" "https://developers.naver.com/apps/#/register" "$BASE/api/auth/callback/naver" "브라우저에 네이버 개발자센터가 열렸어요.

1) 애플리케이션 이름: befun
2) 사용 API: 네이버 로그인 → 이메일, 이름 체크
3) 환경 추가: PC 웹 → 서비스 URL: http://localhost:3003
4) Callback URL: Cmd+V (주소가 이미 복사돼 있어요) → 등록하기
5) 나오는 'Client ID'와 'Client Secret' 준비")
if [ "$R" = "키 입력하기" ]; then
  V=$(ask "네이버" "Client ID를 붙여넣으세요"); [ -n "$V" ] && save NAVER_CLIENT_ID "$V"
  V=$(ask "네이버" "Client Secret을 붙여넣으세요" hidden); [ -n "$V" ] && save NAVER_CLIENT_SECRET "$V"
fi; fi
echo "완료"
