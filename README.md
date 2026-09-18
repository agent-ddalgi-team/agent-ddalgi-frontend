# agent-ddalgi-frontend

회사소개서 초안 생성 AI 에이전트의 프론트엔드. React + TypeScript + Vite + Tailwind.

## 시작하기

```bash
npm install
cp .env.example .env   # VITE_API_URL에 백엔드 주소 입력 (예: http://127.0.0.1:8000)
npm run dev
```

백엔드(FastAPI)가 별도로 떠 있어야 합니다. 백엔드 저장소의 `contracts/contract.md` 기준으로 프론트/백엔드는 같은 origin에서 호출해야 하므로, 개발 서버는 `/api` 요청을 `VITE_API_URL`로 프록시합니다(`vite.config.ts`).

## 스크립트

- `npm run dev` — 개발 서버 실행
- `npm run build` — 타입체크 후 프로덕션 빌드
- `npm run lint` / `npm run format` — ESLint / Prettier

## 구조

- `src/types/profile.ts` — 백엔드 `contracts/profile.schema.json`(schema_version 1.0) 대응 타입
- `src/api/` — 생성(`POST /api/profiles`)·조회(`GET /api/profiles/{job_id}`)·문서 다운로드 API 클라이언트
- `src/hooks/useProfileJob.ts` — 작업 생성, 1초 간격 폴링, 문서 다운로드 상태 관리
- `src/components/profile/` — 파일 업로드, 결과(회사정보/본문/확인질문/근거자료), 문서 저장 화면 컴포넌트

API 규격·JSON 키는 백엔드 저장소([agent-ddalgi](https://github.com/agent-ddalgi-team/agent-ddalgi))의 `contracts/`가 팀 공통 계약이므로 임의로 바꾸지 않습니다. 화면 시험용 Mock JSON(`fixtures/mock_job_ready.json`, `mock_job_error.json`)도 백엔드 저장소에 있습니다.
