# 현재 보안 구현·남은 과제

기준일: 2026-10-12. 코드 대조 기준: 프론트 `05087f8`, 백엔드 `2325d9a`(PR #48에 포함된 코드). 이 문서는 보안 인증이나 침투시험 결과가 아니라 저장소 코드 검토다. 실행 중 서버·배포 환경·비밀 설정값은 조사하지 않았다. 제품 코드/.env/DB 변경 없음.

프론트와 별도 FastAPI 백엔드, SQLite 저장소가 존재한다. 이전의 “백엔드/DB가 없다”, “승인은 브라우저 체크박스뿐”이라는 설명은 현재 구현과 맞지 않는다. 그렇다고 로그인·운영 보안이 모두 구현됐다는 뜻은 아니다.

## 1. 항목별 코드 대조

| 항목 | 코드에서 확인한 동작 | 남은 제한·판단 | 근거 |
|---|---|---|---|
| AUTH-001 세션 접근 | UUID 기반 익명 소유자 쿠키, HttpOnly·SameSite=Lax; 세션의 owner_id와 비교 | 계정 로그인·서명 토큰 검증이 아니다. 기존 쿠키를 읽는 구조이며 Secure 기본 false, 운영 설정 확인 필요 | [access.py](../../../backend/app/access.py), [sessions.py](../../../backend/app/services/sessions.py), [config.py](../../../backend/app/config.py) |
| AUTH-002 역할 권한 | 세션 소유권과 자료 범위 검사가 있음 | 관리자/사용자 로그인·RBAC 미구현. 익명 소유권과 역할 권한을 혼동하지 않음 | [접근 코드](../../../backend/app/access.py), [자료 경로](../../../backend/app/routers/sources.py) |
| AUTH-003 승인 | 현재 문서/입력/검증/배치·차단 문제·확인 상태를 서버가 검사하고 승인/출력 이력을 저장 | 서버 승인 경로에 한정. 암호학적 서명·법적 효력·별도 담당자 이중 승인을 보장하지 않음 | [approvals.py](../../../backend/app/services/approvals.py), [exports.py](../../../backend/app/services/exports.py) |
| AUTH-004 종료·만료 | 비활성/만료 세션 거부, 파생 내용 제거·파일 정리 큐 | 작업 세션 종료이며 계정 로그아웃/소유자 쿠키 전체 철회와 다름. 정리 지연·백업 정책은 운영 검토 필요 | [sessions.py](../../../backend/app/services/sessions.py), [cleanup.py](../../../backend/app/services/cleanup.py) |
| INPUT-001 입력 | Pydantic 형식/길이/버전과 서비스의 현재 버전·근거 ID 검사 | 모든 입력의 의미·진위나 일반적인 공격 완전 차단을 보장하지 않음 | [models.py](../../../backend/app/models.py), [validation.py](../../../backend/app/services/validation.py) |
| FILE-001 형식·악성 파일 | 확장자 허용 목록과 파서의 열기/읽기 오류 처리가 있음 | 업로드 MIME은 확장자 추정/전달값을 사용한다. 모든 형식의 매직 바이트 기반 MIME 검증·AV 스캔은 구현 확인 못함 | [sources.validate_uploads](../../../backend/app/services/sources.py), [파서](../../../backend/app/parsers/) |
| FILE-002 저장·다운로드 | 서버가 source_id 기반 이름으로 저장; 직접 첨부 원본은 세션 경로·선택 버전·재분석 지점·해시를 검사. 원본 응답 attachment/nosniff/no-store | 각 다운로드 경로의 검사 범위는 별개다. 원본 GET만의 검사를 전체 파일 API에 적용된 것으로 표현하지 않음 | [sources.py](../../../backend/app/services/sources.py), [sources router](../../../backend/app/routers/sources.py), [export router](../../../backend/app/routers/exports.py) |
| FILE-003 용량 | 업로드 실제 읽은 바이트와 세션 파일 수 제한; 기본 파일당10MiB·세션10개 | 프록시 전체 요청/동시성 제한은 미확인. 일부 PPTX 처리에 압축 엔트리/해제 크기 제한이 있으나 모든 포맷의 ZIP bomb 방어 완료를 뜻하지 않음 | [config.py](../../../backend/app/config.py), [sources.py](../../../backend/app/services/sources.py), [office.py](../../../backend/app/parsers/office.py) |
| CRAWL-001/002 SSRF | Vite 사진 요청에 HTTP(S)/포트·공개 IP 검사, DNS 결과 확인·주소 고정, 리다이렉트 재검사, 크기/시간/MIME 제한, 기본 TLS 검증 | 개발 서버 플러그인이다. 운영 API/네트워크 egress 격리가 자동 제공되지 않음. DART는 별도 고정 endpoint 경로 | [vite.config.ts](../../vite.config.ts), [DART 처리](../../../backend/app/services/sources.py) |
| AGENT-001 결과 적용 | 서버가 자료 범위·버전·제안 적용 요청을 검사; AI 제안은 명시 적용 전 저장 문서를 바꾸지 않음 | 프롬프트 지침만으로 모든 주입 공격을 차단했다고 주장하지 않음 | [proposals.py](../../../backend/app/routers/proposals.py), [ai_jobs.py](../../../backend/app/services/ai_jobs.py) |
| AGENT-002 중요 동작 | 서버 승인·적용·종료 경로가 존재하고 중복 요청/버전을 검사 | 별도 2인 승인·외부 발송 워크플로우는 구현 확인 못함. 브라우저 즉시 PDF는 별도 경로 | [승인](../../../backend/app/services/approvals.py), [멱등](../../../backend/app/services/idempotency.py) |
| AGENT-003 출력 | 모델/근거 범위 검사와 서버 HTML 출력의 Jinja autoescape | 범용 개인정보 탐지·마스킹/DLP·탈옥 방지 완성으로 표현할 수 없음 | [validation.py](../../../backend/app/services/validation.py), [export_render.py](../../../backend/app/services/export_render.py) |
| AGENT-004 호출 비용 | Job 중복·실행 정책, 제한 평가용 TrialLedger와 별도 RuntimeLedger가 있음 | 기본 runtime과 시험용 호출/예산 제한은 다르다. 사용자/IP/세션별 운영 rate limit은 확인 못함 | [agent_llm.py](../../../backend/app/agent_llm.py), [jobs.py](../../../backend/app/services/jobs.py) |
| Origin/CSRF | 설정 기반 CORS 허용 목록·credentials와 SameSite 쿠키 | 별도 CSRF 토큰/요청 Origin 검증 계층은 확인 못함. CORS를 인증 또는 전체 CSRF 방어로 설명하지 않음 | [앱 미들웨어](../../../backend/app/__init__.py), [접근 설정](../../../backend/app/access.py) |

## 2. 프론트에서 확인한 중요한 차이

- **편집 내용은 암호화되지 않는다.** [usePublication.ts](../../src/hooks/usePublication.ts)의 persistLocalEdits가 edits/removed를 JSON 문자열로 sessionStorage에 저장한다. 탭 내 복구용이며 저장 실패를 무시하는 분기가 있어 무손실·100% 복구를 보장하지 않는다. 시연 상태도 브라우저에 보관된다. 서버 세션 만료가 모든 브라우저 탭의 사본을 원격 삭제하는 것은 아니다.
- **두 PDF 경로를 구분해야 한다.** 서버 승인 출력은 현재 검증·배치·승인을 검사한다. 반면 [DocumentWorkspace.tsx](../../src/components/session/DocumentWorkspace.tsx)의 handleInstantPdfExport는 [pdfExport.ts](../../src/utils/pdfExport.ts)의 고정 8쪽 자료 생성기를 호출한다. 현재 저장 문서나 서버 승인 ID를 넘기지 않고 회사명을 고정 전달한다. 이 버튼의 파일을 ‘현재 검증·승인된 문서’로 안내하면 안 된다. 제품 표시/노출 제한 또는 정식 출력 경로로 통합하는 후속 작업이 필요하다.
- **보이는 근거는 검증 결과와 다르다.** 원문 발췌·출처 표시가 문장의 진위를 자동 보장하지 않는다. 원문 오타 정정 역시 기록 후 재검증하며 강제 통과가 아니다.
- **시연 모드와 실제 모드는 다르다.** 명시적 preview 모드의 가상 응답을 실제 AI/서버 승인 완료로 설명하지 않는다.

## 3. 현재 남은 과제

| ID | 과제 | 현재 상태 |
|---|---|---|
| SEC-01 | 즉시 PDF와 서버 승인 출력의 표시/권한 경로 정리 | 코드 차이 확인, 제품 수정 미실행 |
| SEC-02 | 민감 편집 내용의 브라우저 보관·종료/만료·보존 안내 정책 | JSON 저장 확인, 정책/제품 보완 미실행 |
| SEC-03 | 운영 계정 인증·소유자 자격증명 수명/철회·역할 권한·CSRF 정책 | 익명 MVP 범위와 구분하여 설계 필요 |
| SEC-04 | 서버/프록시 rate limit·동시성/용량·AI 비용 통제 | 제한 평가 설정만으로 운영 완료 처리 금지 |
| SEC-05 | 실제 파일 형식·악성 문서 검사와 파서 자원 격리 | 구현 범위 확대 여부 결정 필요 |
| SEC-06 | HTTPS·보안 헤더·운영 쿠키·로그/백업 정책 | [배포 확인표](DEPLOYMENT_SECURITY_REQUIRED.md), 실제 배포 미확인 |

이 항목은 문서 대조 결과로 남긴 과제이며 이번 작업에서 기능을 새로 구현하거나 백엔드 담당 작업 상태를 변경하지 않는다. 변경이 확인되면 관련 코드·실제 검증 근거와 함께 이 표를 갱신한다.
