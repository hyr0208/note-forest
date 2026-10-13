# 노트숲 (Note Forest)

어디서든 이어 쓰는 나만의 메모 공간.

노트숲은 메모를 빠르게 작성하고 정리할 수 있는 개인용 웹앱입니다. 이 저장소에는 React 기반 웹 클라이언트가 들어 있습니다.

## 현재 상태

초기 UI 프로토타입입니다. 현재 메모는 브라우저의 로컬 저장소에 저장되며, 계정 로그인과 기기 간 동기화는 아직 연결되어 있지 않습니다.

## 기술 스택

- React
- Vite
- TypeScript
- Tailwind CSS 4
- lucide-react

## 개발 환경 실행

```bash
npm install
npm run dev
```

## 다음 단계

- 로그인 방식과 사용자별 저장소 결정
- 메모/폴더 API 및 계정 간 데이터 분리
- 여러 기기 동기화
- Mac Dock 설치를 위한 PWA 구성
