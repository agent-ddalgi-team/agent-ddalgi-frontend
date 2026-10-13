# 프론트 현재 작업 현황

문서 기준일: 2026-10-13. 최초 기능 대조는 프론트 `05087f8`·백엔드 `2325d9a`, 이번 README/실행 설정 대조는 프론트 `f506892`·백엔드 `2f4b4e3` 기준이다. 아래 내용은 코드에서 확인한 상태이며 과거 보고서의 홍보 문구나 미구현 제안을 확정 사항으로 취급하지 않는다.

## 1. 문서 원본과 읽는 순서

1. [README](../README.md): 실행·폴더·파일 관리 안내.
2. 이 문서: 현재 상태·남은 과제·새 작업 기록의 원본.
3. [보안 구현 대조](security/BACKEND_SECURITY_REQUIRED.md), [배포 확인표](security/DEPLOYMENT_SECURITY_REQUIRED.md): 코드로 확인한 범위와 미해결 과제.
4. [reference](reference/): 발표·화면 시안·샘플. 제품 기준이나 보안 증명이 아니다.
5. [history](history/): 과거 기록. 오래된 지침·가정은 현재 작업에 적용하지 않는다.

백엔드 API 계약 원본은 [backend/docs/contracts.md](../../backend/docs/contracts.md)이며 프론트 문서에서 새 사본을 만들지 않는다. 두 저장소가 같은 상위 폴더의 `frontend/`·`backend/`에 있을 때 로컬 백엔드 링크가 열린다. 다른 배치에서는 별도 백엔드 저장소의 같은 문서를 찾는다. 제품/API 상태는 해당 원본을 따른다.

## 2. 현재 기능과 제약

- S01 자료 선택/점검, S02 편집, S03 검증/승인/서버 출력 흐름이 연결되어 있다. 현재 프론트는 전달받은 발췌문/출처 표시와 정정 사유·근거 기록 후 재검증을 지원한다. 백엔드 segments/original API는 존재하지만 현재 프론트 src에는 조회 호출·원본 다운로드 연결·등록/자동 추출 구분 필드가 없다. 따라서 이 브랜치에서 추출문 조회/원본 다운로드 화면까지 완료됐다고 표시하지 않는다. 서버의 소유권·버전·검증 조건을 따라야 한다.
- 원문 오타 정정은 백엔드 PR #48/test와 프론트 PR #29/develop에 병합됐다. 폴더 정리·목차 겹침 수정·이전 문서 정리는 현재 작업 브랜치의 기반인 develop 커밋 `9be1b04`에 포함돼 있다. 이번 README 개편과 관리 규칙은 별도 작업 브랜치의 로컬 커밋이며 원격 공유 여부와 구분한다.
- 목차 겹침은 패널 자식 축소로 재현했고 높이 유지·스크롤로 수정했다. 가상 긴 목차의 1440/1100/390px, 편집/저장/복원 흐름 검수와 빌드가 통과했다. 상세 과거 실행값은 [통합 이력](history/WORK_HISTORY.md)에 보존했다.
- 프론트가 별도 시연 모드를 제공한다. 실제 서버 결과와 명시적인 가상 데이터는 구분해야 하며, 가상 모드의 승인/검증은 실제 AI/서버 승인 결과가 아니다.

### 기존 노션 요약에서 통합한 사항

PR #26/#27 관련 요약의 고유 항목을 아래로 통합했다. 원본의 “100%”, “암호화”, “원천 차단” 표현은 코드로 뒷받침되지 않아 현재 설명에서 제외했다.

| 항목 | 현재 설명·관련 코드 |
|---|---|
| 오류 경계·모드 전환 | ErrorBoundary, App, main, SourceSelectionView에 복구/시연 진입 동작이 있다. 모든 오류 예방이나 무중단 보장을 뜻하지 않는다 |
| 편집 복구 | usePublication이 edits/removed를 sessionStorage에 JSON으로 보관한다. 암호화 저장이 아니며 브라우저/저장 오류 때 무손실 복구를 보장하지 않는다 |
| 근거 표시 | DocumentWorkspace에서 근거를 확인한다. 표시 자체가 사실 검증을 대신하지 않는다 |
| 회사/목적 선택 편의 | CompanyChangeModal과 SourceSelectionView의 실제 선택 UI를 따른다. 과거 대본의 프리셋 종류를 현재 동작으로 고정하지 않는다 |
| 단축키·효과 | DocumentWorkspace 단축키와 Confetti/FloatingToast가 있다. 보안 기능이 아니다 |
| 즉시 PDF | 고정 8쪽 자료의 브라우저 생성 경로이며 현재 문서의 서버 승인 출력과 별개다. SEC-01 후속 필요 |
| 발표 자료 | [시연 대본](reference/DEMO_PRESENTATION_SCRIPT.md)은 참고용으로 보관하며 보안/실제 AI 성능 증명으로 사용하지 않는다 |

종합정리 문서의 중복 본문은 더 상세한 이전 WORK_SUMMARY 이력으로 통합했고 차이가 있던 표/표기는 [WORK_HISTORY](history/WORK_HISTORY.md)에 남겼다. NOTION_SUMMARY.md는 이 절로 대체했다. 원래 파일 원문은 이번 커밋 이전 Git 이력에 남는다.

<a id="source-correction-guide"></a>
### 원문 오타 정정 사용법

3단계 내용 검증의 값 불일치 카드에서 **원문 오타 정정**을 누른다. 연결된 원문을 고르고 원문 표기·정정 표기·사유·근거를 입력한 뒤 **정정 기록 후 재검증**을 실행한다. 정정할 표기가 문서에 없으면 먼저 편집·저장한다. 미저장 편집이나 검증 진행 중에는 제출할 수 없다. 근거 설명에 적은 URL은 자동 조회하지 않는다.

원문과 문서를 덮어쓰지 않으며 기록만으로 통과하지 않는다. 해결된 문제의 기록은 처리 이력 표시를 켜서 확인한다. 문서/자료/점검 변경 후에는 과거 기록을 자동 적용하지 않는다. API 실패 뒤 일반 내용 검증을 다시 실행할 수 있다. 종료·만료 때 정정 내용도 정리된다.

백엔드 계약1.13의 `POST /api/v1/sessions/{sid}/issues/{iid}/source-corrections`와 `Issue.source_corrections`를 사용한다. 계약 원본은 [백엔드 문서](../../backend/docs/contracts.md#source-typo-correction)이며 별도 계약 사본을 만들지 않는다. 해당 API를 지원하는 백엔드 코드가 실행되어야 사용할 수 있다.

## 3. 남은 일

| 항목 | 상태·다음 판단 |
|---|---|
| SEC-01~06 | [보안 문서의 과제표](security/BACKEND_SECURITY_REQUIRED.md#3-현재-남은-과제)가 원본. 즉시 PDF 분리, 로컬 편집 보관, 운영 인증/권한/CSRF, 비용·호출 제한, 파일 검사, 배포 설정을 검토해야 함 |
| 과거 개선 보고서의 제안 | [보관 보고서](history/FRONTEND_REFINEMENT_REPORT.md)의 강제 덮어쓰기/블록 병합, 자료 부족 초안 정책, 엄격한 쪽수 맞춤 등은 미확정 제안. 최신 제품 결정 없이 구현 완료/필수 요구로 전환하지 않음 |
| 이미 달라진 제안 | 백엔드에는 segments/original API가 있지만 현재 프론트 연결은 없다. 경고 사유 선택은 현재 화면에 구현됨. 옛 보고서의 “없음” 설명을 그대로 새 과제로 복제하지 않음 |
| 재파싱·오류/배치 상세 제안 | 보고서의 단일 파일 재시도·오류 코드·배치 상세 제안은 최신 백엔드 계약과 대조해 채택 여부를 결정할 사항. 이번 정리에서 새 API를 만들지 않음 |
| FE-DOC-01 충족도 표시 | SourceSelectionView에 파일명/개수 추정과 서버 결과 OR 결합이 남아 있음. 서버 점수 0도 추정값으로 대체될 수 있음. 표시 정책·코드 보완 후 별도 검증 필요; 이번에는 문서만 정정 |
| FE-DOC-02 추출문·원본 연결 | src/api/sources.ts·현재 화면에서 segments/original API 호출이 확인되지 않음. 과거 다른 브랜치 기록과 구분해 연결 복구·화면 검증 필요 |
| 배포·보안 품질 | 코드 읽기와 링크 검수만으로 실제 운영 보안 완료/취약점 없음/실제 AI 품질을 선언하지 않음 |

## 4. 작업 기록 (새 작업은 여기에 누적)

### 2026-10-12 문서 분류·중복 통합·보안 대조

- 과거 9월18일 기록·번호별 이력·개선/보안 보고서를 archive로 이동하고 과거 기록 배너를 추가했다. 참고 시안·샘플·대본은 reference로, 현재 보안 문서2개는 security로 묶었다.
- 현재 상태를 이 파일로 단일화했다. 이전 WORK_SUMMARY의 상세 기록과 종합정리의 고유 차이는 history/WORK_HISTORY로 보존하고 노션 요약의 고유 항목은 2절에 통합했다. 앱 코드·.env·DB·회사 원본은 변경하지 않았다.
- 프론트/백엔드의 접근·세션·업로드·승인/출력·파서·AI 연결과 브라우저 저장/즉시 PDF를 읽어 보안 문서를 갱신했다. 과거의 백엔드 부재·브라우저 암호화·자동 보안 완성 설명을 정정했다.
- 작업 규칙은 새 번호 MD 자동 생성 대신 기존 WORK_SUMMARY에 누적하도록 바꿨다. README의 구조·문서 링크·파일 목록, 기존 도구 설명 경로를 함께 갱신했다. README에 섞인 과거 연동/검증 기록은 WORK_HISTORY로 옮기고 현재 실행법과 검사 명령을 남겼다.
- 검증: 로컬 Markdown 링크/코드 근거 경로 86개가 모두 존재함을 확인했다. 전체 파일 목록 122개 대조, 옛 경로 참조 점검, 이동된 HTML/PNG 10개의 원본 바이트 일치, Git diff 공백 검사와 변경된 JS 2개 구문 검사가 통과했다. 문서/주석 외 제품 변경이 없어 빌드·pytest·브라우저·유료 AI는 반복하지 않는다. 실제 배포 헤더·운영 환경·취약점 전수 검사는 미실행이다.
- 백엔드 docs도 읽기 전용 확인했다. MD9개이며 현재 계약/설계/작업표와 누적된 과거 이력을 구분할 후보가 있다. 백엔드 파일은 수정하지 않았다.

### 2026-10-12 history 3개로 통합·현재 설명 정정

- 사용자가 이동한 history 폴더를 기준으로 WORK_HISTORY, FRONTEND_REFINEMENT_REPORT, B_프론트엔드_검증기록_0918 3개를 유지한다. 00/02/03/04/05·9월18일 작업기록·보안 보고서는 WORK_HISTORY에 원인·변경·검증 범위·현재와의 차이를 통합 후 삭제한다. 일일요약·01 브랜치 비교는 제거하며 원문은 ff4297e Git 이력에 남는다.
- 파일명 기반 충족도, 서버 점수 0 대체, 브라우저 JSON 보관, 즉시 PDF와 승인 출력 차이를 현재 코드에 맞춰 설명했다. 추출문/원본 API의 백엔드 구현과 현재 프론트 연결 부재를 구분하고 FE-DOC-01/02로 남겼다. 기능 완료 상태를 임의로 올리지 않는다.
- README의 구조·113개 파일 목록, 문서/작업 규칙/검사 스크립트 주석의 경로·링크를 수정했다. 발표 대본의 암호화·무중단·환각 차단 보장도 현재 코드 설명으로 바꿨다. 문서·주석 수정이며 src·설정·의존성·.env·DB 변경은 없다.
- 검증: 로컬 Markdown 링크/앵커 94건 누락0, history MD 정확히 3개, 전체 프로젝트 파일113개와 README 목록 일치, src/public/주요 실행 설정62개 내용 변경0, git diff --check 통과. 문서와 주석만 변경해 빌드·브라우저·DB·유료 AI 검사는 재실행하지 않았다. 로컬 커밋까지만 수행한다. FE-DOC-01/02 및 보안 과제는 미해결로 유지한다.

### 2026-10-13 폴더·README 관리 규칙 추가

- 새 브랜치 `codex/frontend-docs-rules-20261013`에서 기존 [.agents/rules/work_history.md](../.agents/rules/work_history.md)에 [폴더 관리](../.agents/rules/work_history.md#folder-management)·[README 관리](../.agents/rules/work_history.md#readme-management) 규칙을 추가했다. 기존 파일 위치 재사용, 새 최상위 폴더의 목적·합의, 문서 중복 방지, 생성물·개인 자료 보호, 경로 변경 시 참조와 관련 검증을 함께 다루도록 했다. 기존 새 문서 확인 절차와 작업 기록 규칙은 유지했다.
- README에는 규칙 원본의 두 절로 가는 링크만 보완했다. README의 현재 목적·실행·구조·문서 안내를 중심으로 남기는 9항목 기준과, 코드·설정 대조 및 현재 안내/과거 기록 구분 규칙을 정했다.
- README 본문 축약·정보 이동은 아직 하지 않았다. 전체 파일·삭제 판단, 원문 오타 정정 상세, 검수 명령과 과거 정리 설명의 유지·축약·기존 문서 이동안을 제시하고 해당 변경은 승인 후 진행한다. 현재 기능·보안 과제의 완료 상태는 변경하지 않았다.
- 검증: README의 모든 상대 링크 22개, 지침의 상대 링크 1개, 작업 기록에 추가한 링크 3개의 경로·앵커를 확인했다(누락 0). 별도 백엔드 저장소 링크는 현재 두 저장소가 나란히 있는 배치에서 확인했다. 기존 지침 보존, README 규칙 링크 1행 외 변경 없음, 변경 파일 3개와 `git diff --check` 통과를 확인했다. 문서만 수정해 앱 빌드·브라우저·백엔드·DB·유료 AI 검사는 실행하지 않았다. 로컬 커밋까지만 진행하며 push·PR·병합하지 않는다.


### 2026-10-13 README 입구 문서 개편 (승인한 이동안 반영)

- README를 목적·기능·준비/환경설정·실행·검사·주요 폴더·주의사항·상세 링크 중심으로 재구성했다. 폴더 역할과 자료가 쌓이는 위치는 남겼다.
- 전체 파일 목록·삭제 판단은 이 문서 5절, 오타 정정 사용법은 2절, 기능별 검사는 6절로 이동했다. 과거 정리·시연 검수 기록은 WORK_HISTORY에 구분했다. 기존 자료의 고유 내용과 113개 파일 행을 보존한다.
- package.json/lock·Vite 프록시·검사 스크립트·화면/API를 대조했다. 없는 npm test를 추가하지 않고 개인 PC 경로를 설정 설명으로 바꿨다. 자료 API의 원본 조회 완료로 읽힐 수 있는 표기를 정정했다. 기존 FE-DOC-01/02·보안 미해결 상태는 유지한다.
- 검증: README 277→90줄, 폴더 트리·113개 파일 목록 보존 및 Git 추적 파일 대조 통과. README 상대 링크 21개, 이 문서 전체 상대 링크 18개, 보관 이력에 추가한 링크 3개의 경로·앵커 누락 0. npm 명령과 package.json 일치, README PowerShell 명령 블록 1개 구문 검사, git diff --check 통과. 앱 테스트·빌드는 실행하지 않았다. 문서 3개만 변경했고 앱 코드·설정·의존성·개인 .claude/·.env·DB는 보존했다. 새 파일·폴더 없이 로컬 커밋까지만 수행한다.

<a id="file-retention"></a>
## 5. 폴더·파일 관리 부록

**용량을 비우려면 생성물부터 확인한다. 소스·설정·자료를 단순히 안 보인다는 이유로 삭제하지 않는다.** 아래의 ‘유지’는 영구 삭제 금지가 아니라 현재 기능·개발 방식을 유지할 때 필요한 파일이라는 뜻이다. 과거 문서 통합·삭제 과정은 [보관 이력](history/WORK_HISTORY.md#readme-history-20261013)을 참고한다.

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

`node_modules/`·`dist/`·`.git/` 내부 파일은 위 폴더 정책을 전부 적용한다. 자동으로 바뀌는 수천 개 라이브러리/산출물/Git 내부 파일을 개별 삭제 목록으로 관리하지 않는다. 아래 개별 파일 경로는 프론트 저장소 루트 기준이다. `.env`와 `.claude/launch.json`은 미추적/제외 파일이므로 위 표에서 별도로 다룬다.

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
| `src/api/sources.ts` | 자료 목록·업로드·선택·회사 검색 API (추출문/원본 조회 미연결) | 유지 |
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

목록 대조 기준: 2026-10-13, Git 추적 프로젝트 파일 113개. 새 파일 추가·삭제 때 이 관리 부록의 관련 항목을 함께 갱신한다. 자동 생성물과 개인 파일은 위 폴더 정책을 따른다.

</details>

### 작업 후 자료 위치·탐색기 표시

새 번호 MD를 자동 생성하지 않고 작업 기록은 이 문서 4절에 누적한다. 과거 기록의 옛 생성 지침은 적용하지 않는다. MD가 프로그램을 설정하거나 모든 도구에서 자동으로 읽히는 것은 아니다. [현재 작업 규칙](../.agents/rules/work_history.md)을 따른다.

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

VS Code 탐색기에서는 실행·환경 설정을 `package.json` 아래로 접어 표시한다. 왼쪽 화살표를 펼치면 모든 파일을 볼 수 있으며 실제 경로·Git 추적·실행에는 영향이 없다. 프론트 폴더만 열면 이 저장소의 `.vscode/settings.json`이 적용된다. 상위 폴더를 작업공간으로 열 때는 그 폴더의 `.vscode/settings.json`에 같은 표시 설정이 있어야 한다. 상위 폴더의 설정은 이 저장소의 pull로 자동 공유되지 않는다.

<a id="frontend-checks"></a>
## 6. 기능별 검사 안내

아래 명령은 프론트 저장소 루트에서 실행한다. 기본 빌드·정적 검사는 [README](../README.md#개발검사-명령)를 따른다. 여기의 실행 방법은 과거 통과 기록과 구분한다.

- 가상 컴포넌트 렌더링: `node scripts/checks/run_ssr.mjs`. Vite와 React 의존성 설치 후 실행하며 자료를 다른 폴더로 복사하지 않는다. 구형 profile 화면의 SSR 확인이므로 전체 최신 화면·실제 AI 품질 검사를 대신하지 않는다.
- 브라우저 흐름 검사: `scripts/check-ai-workflow.mjs`. 현재 도구는 Windows의 `.venv/Scripts/python.exe`와 Chrome 설치 경로를 사용하므로 해당 환경을 준비해야 한다. 다른 OS에서 그대로 동작한다고 보장하지 않는다.
- `AI_CHECK_BACKEND`에는 자신의 백엔드 저장소 경로를 지정한다. 아래 예시는 두 저장소가 같은 상위 폴더에서 `frontend/`·`backend/` 이름으로 나란히 있는 경우다. 다른 배치라면 그 값을 해당 PC에 맞게 바꾼다.

```powershell
$env:AI_CHECK_BACKEND = (Resolve-Path '../backend').Path
$env:AI_CHECK_LIVE = '0'
node scripts/check-ai-workflow.mjs --source-correction
```

| 옵션 | 목적·준비 조건 |
|---|---|
| `--source-correction` | 격리한 임시 DB·가상 AI에서 정정 입력·기록·재검증·다른 blocker 유지·새로고침 이력 확인 |
| `--publication` | 편집·내용 검증·승인·출력 흐름. 해당 브라우저·출력 도구도 필요 |
| `--screen-preview` | 명시적 가상 화면 검사. 별도 프론트 개발 서버를 5173 포트로 실행한 상태에서 사용 |

가상 화면 검사 예시는 위 환경 설정 후 `node scripts/check-ai-workflow.mjs --screen-preview`다. 일반 격리 검사는 별도 임시 DB/가상 AI를 사용하며 캡처·임시 산출물은 시스템 임시 폴더에 남을 수 있다. `AI_CHECK_LIVE=1`은 비용이 발생하는 별도 실제 AI 검사이므로 기본 명령으로 사용하지 않는다. 가상 검사 성공은 유료 AI 판단 품질을 뜻하지 않는다. 이번 문서 개편에서는 이 기능 검사를 다시 실행하지 않았다.
