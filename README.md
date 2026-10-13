# 노트숲 (Note Forest)

어디서든 이어 쓰는 나만의 메모 공간.

노트숲은 메모를 빠르게 작성하고 정리해 여러 기기에서 이어 볼 수 있는 개인용 웹앱입니다.

## 기능

- 이메일과 비밀번호로 가입 및 로그인
- 계정별 메모와 폴더 저장, 기기 간 실시간 동기화
- 자동 저장, 검색, 즐겨찾기
- Markdown 편집과 미리보기
- 휴지통과 복원, Markdown 파일 내보내기
- Mac Dock 등에서 앱처럼 여는 PWA 구성
- Supabase Row Level Security로 사용자별 데이터 분리

## 기술 스택

- React, Vite, TypeScript
- Tailwind CSS 4
- Supabase Auth, Postgres, Realtime
- react-markdown, remark-gfm, lucide-react

## 로컬 개발

```bash
npm install
npm run dev
```

Supabase 설정 전에도 로컬 미리보기로 화면을 둘러볼 수 있습니다. 미리보기 메모는 현재 브라우저의 로컬 저장소에 저장됩니다.

## 계정 동기화 설정

1. Supabase에서 새 프로젝트를 만듭니다.
2. Supabase SQL Editor에서 [`supabase/migrations/20261013000000_notes_folders.sql`](supabase/migrations/20261013000000_notes_folders.sql)의 내용을 실행합니다.
3. `.env.example`을 `.env.local`로 복사하고 프로젝트 URL과 Publishable key를 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`에 입력합니다.
4. Auth URL 설정에서 로컬 개발 주소 `http://localhost:5173`을 허용하고, 확인 이메일을 사용할 경우 이메일 발신 설정을 확인합니다.
5. 개발 서버를 다시 시작합니다. 로그인과 계정별 클라우드 저장 화면이 활성화됩니다.

브라우저 앱에는 Publishable key만 사용합니다. `service_role` 키는 브라우저 환경 변수나 저장소에 넣지 마세요. 데이터 접근은 마이그레이션에 정의된 RLS 정책으로 사용자 계정에 제한됩니다.

## macOS 앱 만들기

Cloudflare Pages에 배포한 뒤 아래 명령으로 설치용 DMG를 만들 수 있습니다.

```bash
npm run build:macos -- https://note-forest.pages.dev
```

결과는 `dist/macos/note-forest-macos.dmg`에 생성됩니다. DMG를 열고 `Note Forest.app`을 Applications로 드래그해 설치합니다. 다른 도메인을 연결했다면 명령의 URL을 실제 서비스 주소로 바꿉니다.

이 macOS 앱은 설치 가능한 창과 앱 아이콘을 제공하고, 노트숲 웹 서비스를 열어 사용합니다. 메모 동기화에는 인터넷 연결이 필요합니다. 이 빌드는 개인 설치를 위한 ad-hoc 서명이므로 macOS가 처음 실행을 확인할 수 있습니다. 다른 사람에게 경고 없이 배포하려면 Apple Developer ID 서명과 공증이 추가로 필요합니다.
