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

## Mac에 설치

HTTPS로 배포한 사이트를 Safari에서 열고 **파일 → Dock에 추가**를 선택하면 앱처럼 실행할 수 있습니다. 배포 환경에서는 Supabase Auth의 허용 리디렉션 URL에도 사이트 주소를 추가해야 합니다.
