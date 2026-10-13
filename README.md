# agent-ddalgi-frontend

## 폴더·문서 찾아가기

삭제 여부를 확인하려면 [폴더·파일 삭제 판단과 전체 파일 목록](#file-retention)을 참고한다.

일반 문서는 `docs/`, 실행·검증 도구는 `scripts/`, 화면 코드는 `src/`에 둔다. 아래 경로는 프론트 저장소 루트 기준이며 개발/빌드 명령은 루트에서 실행한다. 이 구조는 `codex/frontend-folder-organization-20261012` 정리 브랜치 기준이다.

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

- 현재 기준: [작업 현황·남은 일](docs/WORK_SUMMARY.md), [보안 구현 대조](docs/security/BACKEND_SECURITY_REQUIRED.md), [배포 확인표](docs/security/DEPLOYMENT_SECURITY_REQUIRED.md)
- 과거 보관: [통합 작업 이력](docs/history/WORK_HISTORY.md), [개선 제안](docs/history/FRONTEND_REFINEMENT_REPORT.md), [구형 SSR 검증 기록](docs/history/B_프론트엔드_검증기록_0918.md)
- 선택 참고: [시연 대본](docs/reference/DEMO_PRESENTATION_SCRIPT.md), [설계 시안](docs/reference/prototype/), [가상 출력 샘플](docs/reference/샘플문서/)
- 가상 자료: [테스트 자료](scripts/fixtures/), [자료 사용법](scripts/fixtures/day2_테스트데이터_사용법.md)
- 작업 규칙: [.agents/rules/work_history.md](.agents/rules/work_history.md)의 [폴더 관리 규칙](.agents/rules/work_history.md#folder-management)과 [README 관리 규칙](.agents/rules/work_history.md#readme-management)을 따른다. 새 번호 MD를 자동 생성하지 않고 `docs/WORK_SUMMARY.md` 4절에 누적한다. 과거 기록의 옛 생성 지침은 적용하지 않는다. MD가 프로그램을 설정하거나 모든 도구에서 자동으로 읽히는 것은 아니다.

**현재 설명과 과거 기록을 구분한다.** 보안 문서는 프론트·백엔드 코드를 대조한 현재 기준이며 history/발표 대본은 당시 기록이다. 편집 내용의 sessionStorage 보관은 암호화가 아니고, ‘즉시 PDF’는 현재 문서의 서버 승인 출력과 별개다. 자세한 근거와 남은 과제는 위 보안 문서를 따른다. 중복 노션 요약은 WORK_SUMMARY에, 번호별 기록 등 7개 문서의 핵심은 WORK_HISTORY에 통합했다. 일일요약·옛 브랜치 비교는 제거했다. history에는 MD 3개만 유지하고 새 작업마다 별도 파일을 만들지 않는다.

**현재 코드의 제한:** 충족도 표시에는 파일명·개수 추정이 섞이며, 백엔드 추출문/원본 API를 호출하는 프론트 연결은 현재 없다. 발췌문 표시·오타 정정과 구분한다. [FE-DOC-01/02](docs/WORK_SUMMARY.md#3-남은-일)에 후속으로 기록했으며 이번 문서 정리에서 제품 코드를 수정하지 않았다.

| 작업 후 생기는 것 | 위치·관리 방법 |
|---|---|
| 새 화면·로직 | `src/components/`, `src/hooks/`, `src/api/`, `src/types/`, `src/utils/` 등 해당 역할 폴더 |
| 보고서·설계·작업 기록 | 현재 상태/새 작업은 `docs/WORK_SUMMARY.md`; 기존 보안·참고 문서를 갱신하고 과거 완료 기록만 `history/`에 보관 |
| 검증 도구·가상 자료 | `scripts/`와 `scripts/fixtures/`; 가상 자료 설명 MD는 자료와 함께 둔다 |
| 설치 라이브러리·빌드 산출물 | npm이 `node_modules/`, Vite가 `dist/`에 자동 생성; Git 제외 |
| 업로드·AI 결과·세션 자료 | 백엔드가 관리하며 프론트 소스 폴더에 저장하지 않는다 |
| 내려받은 PDF/DOCX | 브라우저 다운로드 위치; 사용자가 보관 위치를 선택한다 |
| 브라우저 검수 캡처·임시 DB | 검사 도구가 시스템 임시 폴더를 사용한다 |

`package.json`·`package-lock.json`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc`·`.prettierignore`, `.gitignore`·`.gitattributes`, `.env`·`.env.example`은 도구가 찾는 루트에 유지한다. `.env`와 개인 도구 자료는 이동하지 않는다. `public/`은 웹에 공개되는 폴더이므로 보고서·테스트 입력·실회사 원문을 넣지 않는다. 숨김 설정이나 파일 삭제로 정리하지 않는다.

팀원은 이 정리 커밋이 공유 브랜치에 반영된 뒤 pull하면 파일 이동·경로 수정·README 안내를 함께 받는다. 이미 옛 경로를 수정 중이면 병합 충돌을 확인해야 한다. 개인 PC 경로를 지정하는 대신 저장소 안의 상대경로를 사용한다.

VS Code 탐색기에서는 실행·환경 설정을 `package.json` 아래로 접어 표시한다. 왼쪽 화살표를 펼치면 모든 파일을 볼 수 있으며 실제 경로·Git 추적·실행에는 영향이 없다. 프론트 폴더만 열면 이 저장소의 `.vscode/settings.json`이 적용된다. 상위 `final` 폴더를 열 때는 `final/.vscode/settings.json`의 같은 표시 설정을 사용한다.

가상 자료의 화면 렌더링 검사는 복사 없이 `node scripts/checks/run_ssr.mjs`로 실행한다. 폴더를 매번 직접 지정할 필요는 없으며, 검사 도구의 백엔드 위치 등 환경에 따라 달라지는 경로만 별도 지정한다.

<a id="file-retention"></a>

## 폴더·파일 삭제 판단 (2026-10-12 현재 정리 브랜치)

**용량을 비우려면 생성물부터 확인한다. 소스·설정·자료를 단순히 안 보인다는 이유로 삭제하지 않는다.** 아래의 ‘유지’는 영구 삭제 금지가 아니라 현재 기능·개발 방식을 유지할 때 필요한 파일이라는 뜻이다. 코드·설정·회사 자료는 삭제하지 않았다. 문서 정리에서 중복 NOTION_SUMMARY.md에 이어 history의 7개 문서를 핵심 통합 후 제거하고 일일요약·옛 브랜치 비교 2개를 제거했다. 원문은 Git 이력에 남는다.

| 구분 | 대상 | 삭제 전 조건·영향 |
|---|---|---|
| 재생성 가능 | `dist/`와 내부 모든 파일 | 빌드 산출물. 여기서 배포/미리보기를 제공 중이면 중단되므로 사용 종료 후 정리하고 `npm run build`로 복구 |
| 재생성 가능 | `node_modules/.vite/`, `.vite-temp/`, `.tmp/` | 개발 서버/빌드 캐시. 관련 프로세스를 종료한 뒤 정리; 다음 실행에서 재생성 |
| 재설치 필요 | `node_modules/`와 내부 라이브러리 파일 전체 | 설치된 의존성. 없으면 개발·빌드가 안 됨. 서버 종료 후 폴더 단위로 정리하고 lock 파일 기준 재설치; 내부 파일을 골라 지우지 않음 |
| 유지 | `src/` 전체 | 앱 코드·타입·스타일. 일부 옛 시안이 있어도 import·테스트·팀 사용 여부를 함께 확인하기 전 삭제 불가 |
| 유지 | `public/` 전체 | 아이콘·사진이 URL로 참조됨. 대체 파일/참조 수정 없이 삭제하면 깨짐 |
| 유지 | `.git/`와 내부 모든 파일 | 로컬 커밋·브랜치·설정·복구 이력. 캐시가 아니므로 청소 대상으로 삼지 않음 |
| 유지 | `.env` | 개인 실행 설정. Git에 없으므로 삭제하면 Git으로 복구되지 않음. 내용은 공개하지 않음 |
| 유지 | 루트 실행·검사·Git 설정 | 아래 개별 표 참조. 삭제 대신 필요 시 설정 변경과 검증을 함께 진행 |
| 확인 후 선택 | `.vscode/` | 앱 실행에는 불필요하지만 삭제하면 파일 접기·포맷·확장 안내가 사라짐. 현재 요청한 표시를 유지하려면 보존 |
| 확인 후 선택 | `.agents/` | 앱 실행에는 불필요하지만 AI 작업 규칙이 사라짐. 팀 규칙으로 사용 중이므로 기본 보존 |
| 확인 후 선택 | `.claude/launch.json` 및 `.claude/` | 개인 Claude 실행 설정, 현재 미추적. 소유자의 사용 여부·백업 확인 후 판단; 자동 재생성을 보장하지 않음 |
| 보관 후 선택 | `docs/`와 내부 문서·HTML·PNG | 앱 실행에는 직접 필요하지 않으나 설계/보안/작업 근거와 링크를 잃음. 폐기할 문서만 팀 합의·보관·링크 수정 후 정리 |
| 검사 기능 유지 시 필요 | `scripts/`와 `scripts/fixtures/` | 제품 배포에는 보통 포함되지 않지만 개발 검증·재현에 필요. 도구 폐기를 결정할 때 관련 안내·참조도 함께 정리 |

`node_modules/`·`dist/`·`.git/` 내부 파일은 위 폴더 정책을 전부 적용한다. 자동으로 바뀌는 수천 개 라이브러리/산출물/Git 내부 파일을 개별 삭제 목록으로 관리하지 않는다. 추적하는 프로젝트 파일은 아래에 빠짐없이 나열했다. `.env`와 `.claude/launch.json`은 미추적/제외 파일이므로 위 표에서 별도로 다룬다.

기존 `DraftEditorView.tsx`, `ApprovalExportView.tsx` 등은 현재 주 화면과 별도로 남아 있는 시안이고, `components/profile/` 일부는 SSR 검수에서 사용한다. 이름에 mock 또는 old 역할이 있다고 삭제 가능한 것은 아니다. `mockBackend.ts`는 현재 명시적 시연 모드에서 사용한다. 별도 미사용 코드 분석 없이 안전 삭제 대상으로 확정하지 않는다.

<details>
<summary>현재 프로젝트 파일 전체: 역할과 삭제 판단 펼치기</summary>

### 루트·도구 설정

| 파일 | 역할 | 삭제 판단 |
|---|---|---|
| `.agents/rules/work_history.md` | AI 작업 기록 위치와 작성 규칙 | 현재 도구 설정 유지 시 보존 |
| `.env.example` | 공유 환경변수 예시; 새 PC 설정 기준 | 유지 |
| `.gitattributes` | 줄바꿈 등 Git 파일 처리 규칙 | 유지 |
| `.gitignore` | 비밀값·의존성·빌드 결과의 Git 제외 | 유지 |
| `.prettierignore` | 자동 포맷에서 제외할 경로 | 유지 |
| `.prettierrc` | 팀 코드 포맷 규칙 | 유지 |
| `.vscode/extensions.json` | 팀 권장 VS Code 확장 목록 | 현재 도구 설정 유지 시 보존 |
| `.vscode/settings.json` | 포맷과 탐색기 파일 접기 설정 | 현재 도구 설정 유지 시 보존 |
| `README.md` | 실행·폴더·사용 안내 | 유지 |
| `eslint.config.js` | 코드 검사 규칙 | 유지 |
| `index.html` | 브라우저 앱 진입 HTML | 유지 |
| `package-lock.json` | 팀이 재현할 의존성 버전 | 유지 |
| `package.json` | 의존성·개발/빌드 명령 | 유지 |
| `tsconfig.app.json` | 화면 TypeScript 검사 설정 | 유지 |
| `tsconfig.json` | TypeScript 프로젝트 연결 | 유지 |
| `tsconfig.node.json` | Vite 설정 코드의 TypeScript 검사 | 유지 |
| `vite.config.ts` | 개발 서버·빌드·API 프록시·사진 수집 연결 | 유지 |

### 화면·API·타입 코드

| 파일 | 역할 | 삭제 판단 |
|---|---|---|
| `src/App.tsx` | 앱 공통 화면과 단계 이동 | 유지 |
| `src/api/aiWorkflow.ts` | 자료 점검·초안 API | 유지 |
| `src/api/client.ts` | 공통 HTTP 처리 | 유지 |
| `src/api/profiles.ts` | 초기 회사정보 API | 유지 |
| `src/api/publication.ts` | 문서 편집·검증·승인·출력 API | 유지 |
| `src/api/sessions.ts` | 작업 세션 API | 유지 |
| `src/api/sources.ts` | 자료·근거·원본 API | 유지 |
| `src/components/common/Confetti.tsx` | 생성 완료 화면 효과 | 유지 |
| `src/components/common/ErrorBoundary.tsx` | 화면 오류 경계 | 유지 |
| `src/components/common/FloatingToast.tsx` | 작업 결과 알림 | 유지 |
| `src/components/profile/CompanyInfoList.tsx` | 회사정보 항목 표시 | 유지 |
| `src/components/profile/ConfirmationList.tsx` | 확인 질문 표시 | 유지 |
| `src/components/profile/DocumentButtons.tsx` | 문서 저장 버튼 | 유지 |
| `src/components/profile/DraftSectionsView.tsx` | 초기 초안 섹션 표시 | 유지 |
| `src/components/profile/FileUploadPanel.tsx` | 초기 자료 업로드 화면 | 유지 |
| `src/components/profile/GeneratePanel.tsx` | 초기 생성 요청 화면 | 유지 |
| `src/components/profile/MockLoaderPanel.tsx` | 가상 JSON 수동 로더 | 유지 |
| `src/components/profile/ResultPanel.tsx` | 회사정보 결과 표시·SSR 검수 대상 | 유지 |
| `src/components/profile/Section.tsx` | 초기 화면 섹션 틀 | 유지 |
| `src/components/profile/SourcesPanel.tsx` | 초기 출처 표시 | 유지 |
| `src/components/profile/StatusPanel.tsx` | 작업 상태/오류 표시·SSR 검수 대상 | 유지 |
| `src/components/session/AiSidecar.tsx` | 문서 편집 보조 패널 | 유지 |
| `src/components/session/AiWorkflowPanel.tsx` | 사전 점검·근거 조회 패널 | 유지 |
| `src/components/session/ApprovalExportView.tsx` | 기존 승인/출력 시안 | 유지 |
| `src/components/session/CompanyChangeModal.tsx` | 대상 회사 변경 창 | 유지 |
| `src/components/session/DocumentExportBar.tsx` | 기존 문서 출력 바 | 유지 |
| `src/components/session/DocumentWorkspace.tsx` | 현재 편집·검증·승인·정정 작업 화면 | 유지 |
| `src/components/session/DraftEditorPanel.tsx` | 기존 초안 편집 패널 | 유지 |
| `src/components/session/DraftEditorView.tsx` | 기존 초안 화면 시안 | 유지 |
| `src/components/session/ParagraphEditor.tsx` | 기존 문단 편집기 | 유지 |
| `src/components/session/PrecheckPanel.tsx` | 기존 점검 패널 | 유지 |
| `src/components/session/SessionMockLoader.tsx` | 기존 가상 세션 로더 | 유지 |
| `src/components/session/SessionUploadPanel.tsx` | 기존 세션 업로드 화면 | 유지 |
| `src/components/session/SourceSelectModal.tsx` | 자료 선택 창 | 유지 |
| `src/components/session/SourceSelectionView.tsx` | 현재 자료 선택·작업 시작 화면 | 유지 |
| `src/components/session/StepIndicator.tsx` | 작업 단계 표시 | 유지 |
| `src/components/session/SystemStatusModal.tsx` | 상태 안내 창 | 유지 |
| `src/components/session/WebPhotoCollector.tsx` | 웹 사진 선택 화면 | 유지 |
| `src/constants/profileLabels.ts` | 회사정보/상태 한글 표시명 | 유지 |
| `src/hooks/useAiWorkflow.ts` | 사전 점검·초안 Job 상태 관리 | 유지 |
| `src/hooks/useProfileJob.ts` | 초기 회사정보 Job 상태 관리 | 유지 |
| `src/hooks/usePublication.ts` | 문서 저장·검증·승인·출력 상태 관리 | 유지 |
| `src/hooks/useSession.ts` | 기존 세션 상태 처리 | 유지 |
| `src/hooks/useSources.ts` | 자료 업로드·선택·복구 상태 관리 | 유지 |
| `src/index.css` | 전체 화면 스타일·반응형 배치 | 유지 |
| `src/main.tsx` | React 앱 시작·전역 스타일·오류 경계 | 유지 |
| `src/services/mockBackend.ts` | 명시적 가상 시연 모드 | 유지 |
| `src/services/webPhotoCrawler.ts` | 웹 사진 수집 요청 | 유지 |
| `src/types/profile.ts` | 초기 회사정보 데이터 타입 | 유지 |
| `src/types/session.ts` | 세션·문서 타입 | 유지 |
| `src/utils/documentExport.ts` | 문서 파일 생성 유틸리티 | 유지 |
| `src/utils/pdfExport.ts` | 브라우저 PDF 생성 유틸리티 | 유지 |
| `src/vite-env.d.ts` | Vite 환경 타입 선언 | 유지 |

### 공개 정적 파일

| 파일 | 역할 | 삭제 판단 |
|---|---|---|
| `public/assets/photos/geosan_catalytic_reactor_process.jpg` | PDF/화면에서 URL로 참조하는 정적 사진 | 유지 |
| `public/assets/photos/geosan_cleanroom_automated_pipes.jpg` | PDF/화면에서 URL로 참조하는 정적 사진 | 유지 |
| `public/assets/photos/geosan_distillation_lab.jpg` | PDF/화면에서 URL로 참조하는 정적 사진 | 유지 |
| `public/assets/photos/geosan_headquarters_facade.jpg` | PDF/화면에서 URL로 참조하는 정적 사진 | 유지 |
| `public/assets/photos/geosan_quality_testing_chamber.jpg` | PDF/화면에서 URL로 참조하는 정적 사진 | 유지 |
| `public/favicon.svg` | 브라우저 탭 아이콘 | 유지 |

### 실행·검사·가상 자료

| 파일 | 역할 | 삭제 판단 |
|---|---|---|
| `scripts/check-ai-workflow.mjs` | 격리 브라우저의 작업·편집·검증·출력 회귀 검사 | 검증 사용 중 유지 |
| `scripts/check-sources.mjs` | 자료 선택/업로드 API 화면 검사 | 검증 사용 중 유지 |
| `scripts/checks/render_check.tsx` | 가상 응답의 화면 렌더링 대조 | 검증 사용 중 유지 |
| `scripts/checks/run_ssr.mjs` | 렌더링 검사 실행기 | 검증 사용 중 유지 |
| `scripts/create_pr.js` | 과거 PR 생성 보조 도구 | 도구 폐기 확인 후 선택 |
| `scripts/fixtures/agent_input_mock.json` | 검사/재현용 가상 입력·응답 | 검증 사용 중 유지 |
| `scripts/fixtures/day2_draft_supported_example.json` | 검사/재현용 가상 입력·응답 | 검증 사용 중 유지 |
| `scripts/fixtures/day2_supported_facts.json` | 검사/재현용 가상 입력·응답 | 검증 사용 중 유지 |
| `scripts/fixtures/day2_variant_source_a.txt` | 검사/재현용 가상 입력·응답 | 검증 사용 중 유지 |
| `scripts/fixtures/day2_variant_source_b.txt` | 검사/재현용 가상 입력·응답 | 검증 사용 중 유지 |
| `scripts/fixtures/day2_테스트데이터_사용법.md` | 가상 테스트 자료 사용 설명 | 검증 사용 중 유지 |
| `scripts/fixtures/mock_job_error.json` | 검사/재현용 가상 입력·응답 | 검증 사용 중 유지 |
| `scripts/fixtures/mock_job_ready.json` | 검사/재현용 가상 입력·응답 | 검증 사용 중 유지 |
| `scripts/fixtures/mock_profile.json` | 검사/재현용 가상 입력·응답 | 검증 사용 중 유지 |
| `scripts/fixtures/mock_source_a.txt` | 검사/재현용 가상 입력·응답 | 검증 사용 중 유지 |
| `scripts/fixtures/mock_source_b.txt` | 검사/재현용 가상 입력·응답 | 검증 사용 중 유지 |
| `scripts/update_pr.js` | 과거 PR 본문 수정 보조 도구 | 도구 폐기 확인 후 선택 |
| `scripts/verify-sufficiency.mjs` | 자료 충족도 화면 검사 도구 | 검증 사용 중 유지 |

### 문서·작업 기록·시안

| 파일 | 역할 | 삭제 판단 |
|---|---|---|
| `docs/history/B_프론트엔드_검증기록_0918.md` | 과거 이력·제안·구형 검증 근거 | 유지; 현재 기준과 구분 |
| `docs/history/FRONTEND_REFINEMENT_REPORT.md` | 과거 이력·제안·구형 검증 근거 | 유지; 현재 기준과 구분 |
| `docs/history/WORK_HISTORY.md` | 과거 이력·제안·구형 검증 근거 | 유지; 현재 기준과 구분 |
| `docs/reference/DEMO_PRESENTATION_SCRIPT.md` | 발표/디자인/샘플 참고 자료 | 팀 사용·참조 확인 후 선택 |
| `docs/reference/prototype/executive_slate_teal/DESIGN.md` | 발표/디자인/샘플 참고 자료 | 팀 사용·참조 확인 후 선택 |
| `docs/reference/prototype/s01/code.html` | 발표/디자인/샘플 참고 자료 | 팀 사용·참조 확인 후 선택 |
| `docs/reference/prototype/s01/screen.png` | 발표/디자인/샘플 참고 자료 | 팀 사용·참조 확인 후 선택 |
| `docs/reference/prototype/s02/code.html` | 발표/디자인/샘플 참고 자료 | 팀 사용·참조 확인 후 선택 |
| `docs/reference/prototype/s02/screen.png` | 발표/디자인/샘플 참고 자료 | 팀 사용·참조 확인 후 선택 |
| `docs/reference/prototype/s03/code.html` | 발표/디자인/샘플 참고 자료 | 팀 사용·참조 확인 후 선택 |
| `docs/reference/prototype/s03/screen.png` | 발표/디자인/샘플 참고 자료 | 팀 사용·참조 확인 후 선택 |
| `docs/reference/prototype/s03_2/code.html` | 발표/디자인/샘플 참고 자료 | 팀 사용·참조 확인 후 선택 |
| `docs/reference/prototype/s03_2/screen.png` | 발표/디자인/샘플 참고 자료 | 팀 사용·참조 확인 후 선택 |
| `docs/reference/prototype/states_recovery_actions/code.html` | 발표/디자인/샘플 참고 자료 | 팀 사용·참조 확인 후 선택 |
| `docs/reference/prototype/states_recovery_actions/screen.png` | 발표/디자인/샘플 참고 자료 | 팀 사용·참조 확인 후 선택 |
| `docs/reference/샘플문서/회사소개서_초안_mock-job-001.md` | 발표/디자인/샘플 참고 자료 | 팀 사용·참조 확인 후 선택 |
| `docs/security/BACKEND_SECURITY_REQUIRED.md` | 현재 상태·코드 대조·배포 기준 | 현재 기준으로 유지 |
| `docs/security/DEPLOYMENT_SECURITY_REQUIRED.md` | 현재 상태·코드 대조·배포 기준 | 현재 기준으로 유지 |
| `docs/WORK_SUMMARY.md` | 현재 상태·코드 대조·배포 기준 | 현재 기준으로 유지 |

점검한 프로젝트 파일: 113개. 자동 생성물과 개인 파일은 위 폴더 정책을 따른다.

</details>

## 원문 오타 정정 (2026-10-12)

3단계 내용 검증의 값 불일치 카드에서 **원문 오타 정정**을 누른다. 연결된 원문을 고르고 원문 표기·정정 표기·사유·근거를 입력한 뒤 **정정 기록 후 재검증**을 실행한다. 정정할 표기가 문서에 없으면 먼저 편집·저장한다. 미저장 편집이나 검증 진행 중에는 제출할 수 없다. 근거 설명에 적은 URL은 자동 조회하지 않는다.

원문과 문서를 덮어쓰지 않으며 기록만으로 통과하지 않는다. 해결된 문제의 기록은 처리 이력 표시를 켜서 확인한다. 문서/자료/점검 변경 후에는 과거 기록을 자동 적용하지 않는다. API 실패 뒤 일반 내용 검증을 다시 실행할 수 있다. 종료·만료 때 정정 내용도 정리된다.

백엔드 계약1.13의 `POST /sessions/{sid}/issues/{iid}/source-corrections`와 `Issue.source_corrections`를 사용한다. 계약 원본은 [백엔드 문서](../backend/docs/contracts.md#source-typo-correction)이며 이 저장소의 타입·화면을 갱신했고 별도 계약 사본은 만들지 않았다. 새 백엔드 코드가 실행되어야 사용할 수 있다.

격리 확인: `AI_CHECK_BACKEND=C:/final/backend`, `AI_CHECK_LIVE=0`에서 `node scripts/check-ai-workflow.mjs --source-correction`. 임시 DB·가상 AI와 실제 HTTP/브라우저로 입력 검증·기록·재검증·다른 blocker 유지·새로고침 이력을 확인한다. 유료 AI 판단 품질 평가는 포함하지 않는다.

## 시작하기

저장소 루트에서 실행한다. 처음 설치할 때 `npm ci`로 lock 파일의 의존성을 설치한다. `.env`가 없을 때만 `.env.example`을 복사하고 `VITE_API_URL`을 실제 백엔드 주소에 맞춘다. 기존 개인 `.env`를 덮어쓰지 않는다.

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

- 실제 연결: 기본 개발 주소 `http://localhost:5173/`. 별도 FastAPI 서버가 필요하다. Vite는 `/api`를 `VITE_API_URL` 또는 기본 `http://127.0.0.1:8000`으로 프록시한다. 포트가 사용 중이면 터미널에 표시된 주소를 확인한다.
- 화면 시연: `http://localhost:5173/?preview=1`. 명시적인 가상 모드이며 실제 AI·서버 승인·출력 결과가 아니다. 실제 연결로 돌아가려면 `preview=1`을 제거한다.
- 백엔드 실행·자료·API 원본: [백엔드 README](../backend/README.md), [계약](../backend/docs/contracts.md). 개인 DB·시연 자료·환경값은 Git으로 자동 공유되지 않는다.
- 배포: `npm run build`로 생성한 `dist/`와 별도 API 배포가 필요하다. 개발 서버의 프록시·사진 수집 기능이 정적 배포에 자동 포함되지는 않는다. [배포 확인표](docs/security/DEPLOYMENT_SECURITY_REQUIRED.md)를 따른다.

## 개발·검사 명령

| 명령 | 용도 |
|---|---|
| `npm run dev` | Vite 개발 서버 |
| `npm run build` | TypeScript 검사 후 배포 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run format:check` | 포맷 검사 |
| `npm run format` | 실제 파일 포맷 변경 |
| `npm run preview` | 로컬 빌드 미리보기; 운영 API 서버를 제공하지 않음 |

가상 화면 검수 예시(백엔드 위치는 각 PC에 맞게 지정):

```powershell
$env:AI_CHECK_BACKEND = 'C:/final/backend'
$env:AI_CHECK_LIVE = '0'
node scripts/check-ai-workflow.mjs --screen-preview
```

`--source-correction`은 정정 기록 흐름, `--publication`은 편집·검증·승인·출력 흐름 검사에 사용한다. 일반 통합 검사는 별도 임시 DB/가상 AI를 사용하며 해당 출력 도구·브라우저 등 준비가 필요하다. `AI_CHECK_LIVE=1`은 비용이 발생하는 별도 실제 AI 검사이므로 기본 명령으로 사용하지 않는다. 이번 문서 정리에서는 이 기능 검사를 재실행하지 않았다.

`src/components/profile/` 등 이전 화면 모듈과 `scripts/fixtures/`는 구형 흐름·SSR 검수에서 참조할 수 있다. 현재 주 화면에서 안 보인다는 이유만으로 삭제하지 않는다.

날짜별 구현·검증·인계 기록과 당시 실행 명령은 [보관 이력](docs/history/WORK_HISTORY.md)에 모았다. 새 작업은 [현재 작업 현황](docs/WORK_SUMMARY.md)의 4절에 누적한다.
