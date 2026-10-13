# agent-ddalgi-frontend

회사 자료를 선택해 소개서 초안을 만들고, 편집·검증·승인·PDF/DOCX 내려받기까지 진행하는 React/TypeScript 웹 화면이다. 실제 AI 처리·저장·승인 출력은 별도 백엔드가 담당한다.

## 주요 기능

- 자료 선택·점검과 초안 생성, 문서·사진 편집, 발췌문·출처 확인.
- 내용 검증·원문 오타 정정 기록 후 재검증·승인·서버 출력. [정정 사용법](docs/WORK_SUMMARY.md#source-correction-guide)
- 명시적인 가상 화면 시연. 실제 AI·서버 승인 결과와 구분한다.

## 준비·환경설정

- Node.js와 npm을 준비한다. 현재 lock의 Vite·ESLint 요구사항을 함께 만족하는 Node 범위는 **20.19 이상인 20.x, 22.13 이상인 22.x, 또는 24 이상**이다.
- 실제 연결에는 별도 FastAPI 백엔드가 필요하다. `.env`가 없을 때만 [.env.example](.env.example)을 복사하고 `VITE_API_URL`을 백엔드 주소에 맞춘다. 기본은 `http://127.0.0.1:8000`이다.
- 기존 `.env`를 덮어쓰거나 비밀값을 커밋하지 않는다. 개인 DB·시연 자료·환경값은 Git pull로 생기지 않는다.

## 시작하기

아래 명령은 **프론트 저장소 루트**에서 실행한다. 처음 설치하거나 lock 파일이 바뀌면 `npm ci`로 의존성을 맞춘다.

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

기본 주소는 `http://127.0.0.1:5173/`이며 포트가 사용 중이면 터미널의 주소를 확인한다. Vite가 `/api`를 백엔드로 프록시한다. `?preview=1`을 붙이면 가상 모드이며 실제 연결로 돌아갈 때는 제거한다.

## 개발·검사 명령

| 명령 | 용도 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | TypeScript 검사 후 `dist/` 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run format:check` | 포맷 검사 |
| `npm run format` | 실제 파일 포맷 변경 |
| `npm run preview` | 빌드 결과의 로컬 미리보기; 운영 API 서버는 별도 |
| `node scripts/checks/run_ssr.mjs` | 가상 컴포넌트 SSR 검사 |

`npm test`는 정의돼 있지 않다. [기능별 브라우저 검사·준비 조건](docs/WORK_SUMMARY.md#frontend-checks)은 별도로 확인한다.

## 폴더·문서 찾아가기

```text
frontend/
├─ src/                    화면·API 연결·상태·타입·스타일
├─ public/                 웹에서 그대로 제공할 정적 파일
├─ docs/                   설명서·보고서·설계·작업 기록
│  ├─ WORK_SUMMARY.md       현재 상태·남은 일·누적 작업 기록
│  ├─ security/            현재 보안 구현·배포 확인표
│  ├─ reference/           발표 대본·화면 시안·샘플
│  └─ history/             통합 이력·개선 제안·구형 검증 기록 (MD 3개)
├─ scripts/                실행·검사·관리 도구
│  ├─ checks/              Mock 화면 렌더링 검사
│  └─ fixtures/            가상 테스트 입력·응답·사용법
├─ .agents/                기존 AI 도구 작업 규칙
├─ .claude/                개인 Claude 설정·자료 (기존 미추적)
├─ .vscode/                VS Code 설정
├─ node_modules/           npm이 설치한 라이브러리 (자동 생성)
├─ dist/                   빌드 결과 (자동 생성)
├─ .git/                   Git 이력
├─ README.md               실행·폴더 안내
└─ 실행·환경 설정 파일
```

새 화면·로직은 `src/`의 components/hooks/api/types/utils 등 해당 역할에, 검사 도구·가상 입력은 `scripts/`·`scripts/fixtures/`에 둔다. 현재 상태와 새 작업 기록은 기존 `docs/WORK_SUMMARY.md`를 갱신한다. 루트 실행·환경 설정 파일은 도구가 찾는 위치에 유지한다.

업로드·AI 결과·세션 자료는 백엔드가 관리한다. PDF/DOCX는 브라우저 다운로드 위치에, 검수 캡처·임시 DB는 검사 도구의 시스템 임시 위치에 저장된다. `node_modules/`·`dist/`는 생성물이다. [상세 파일 관리·VS Code 표시](docs/WORK_SUMMARY.md#file-retention)를 참고한다.

## 중요한 주의사항

- 충족도에는 파일명·개수 추정이 섞인다. 백엔드 추출문/원본 조회 API의 프론트 연결은 미완료이며 발췌문 표시·오타 정정과 구분한다. [남은 과제](docs/WORK_SUMMARY.md#3-남은-일)
- sessionStorage의 편집 보관은 암호화가 아니며, ‘즉시 PDF’는 현재 문서의 서버 승인 출력과 별개다. [보안 구현·제한](docs/security/BACKEND_SECURITY_REQUIRED.md)
- `public/`은 웹 공개 영역이다. 실회사 원문·비밀값·검사 자료를 넣지 않는다.
- 정적 배포에는 `dist/`와 별도 API 배포가 필요하다. Vite 개발 프록시·사진 수집 기능이 자동 포함되지 않는다. [배포 확인표](docs/security/DEPLOYMENT_SECURITY_REQUIRED.md)

<a id="file-retention"></a>
## 상세 문서 링크

| 찾는 내용 | 문서 |
|---|---|
| 작업 규칙 | [폴더 관리](.agents/rules/work_history.md#folder-management), [README 관리](.agents/rules/work_history.md#readme-management) |
| 현재 기능·남은 일·새 작업 기록 | [WORK_SUMMARY](docs/WORK_SUMMARY.md) |
| 전체 파일 역할·삭제 판단 | [관리 부록](docs/WORK_SUMMARY.md#file-retention) |
| 과거 검증·개선 제안 | [통합 이력](docs/history/WORK_HISTORY.md), [개선 제안](docs/history/FRONTEND_REFINEMENT_REPORT.md), [구형 SSR 기록](docs/history/B_프론트엔드_검증기록_0918.md) |
| 선택 참고 자료 | [시연 대본](docs/reference/DEMO_PRESENTATION_SCRIPT.md), [설계 시안](docs/reference/prototype/), [가상 출력 샘플](docs/reference/샘플문서/) |
| 가상 검사 자료 | [fixtures](scripts/fixtures/), [사용법](scripts/fixtures/day2_테스트데이터_사용법.md) |
| 백엔드 실행·API 원본 | [백엔드 README](../backend/README.md), [계약](../backend/docs/contracts.md) |

백엔드 로컬 링크는 두 저장소가 같은 상위 폴더의 `frontend/`·`backend/`에 있을 때 유효하다. 다른 배치에서는 별도 백엔드 저장소의 같은 문서를 찾는다. 과거 이력의 옛 지침은 현재 작업 규칙으로 적용하지 않는다.
