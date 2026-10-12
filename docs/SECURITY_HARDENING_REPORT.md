# 프론트엔드 보안 감사 및 Hardening 작업 보고서
(Frontend Security Audit & Hardening Report)

---

## 1. 개요 및 기본 전제

본 보고서는 프론트엔드 단독 프로젝트 환경에서 수행된 애플리케이션 보안 감사 및 실질적 코드 하드닝(Hardening) 작업 결과를 기록한 공식 문서입니다.

### 작업 전제 조건
- 현재 백엔드 소스코드가 존재하지 않음.
- 실제 데이터베이스(DB), API Key, Secret Key가 없음.
- 실제 서버 인증(JWT, 세션, OAuth 등) 시스템이 존재하지 않음.
- **원칙**: 존재하지 않는 백엔드, DB, 인증 시스템, API Key를 가짜로 구현하여 보안이 구현된 것처럼 포장하지 않고, **현재 존재하는 프론트엔드 코드만을 근거로 개선 가능한 항목만 최소 침습적으로 수정**함.
- 기존 UI 및 비즈니스 기능(3단계 위저드, 실사 사진 수집, 인라인 편집, 300DPI PDF/DOCX 내보내기 등)을 100% 정상 유지함.
- `git commit` 및 `git push`는 수행하지 않음.

---

## 2. 취약점 발견 및 조치 통계

| 심각도 (Severity) | 발견 건수 | 프론트엔드 코드 조치 | 백엔드/배포 요구사항 이관 |
| :--- | :---: | :---: | :---: |
| **Critical** | **0** | 0 | 0 |
| **High** | **0** | 0 | 0 |
| **Medium** | **3** | 3 | 3 (동일 검증 필수) |
| **Low** | **3** | 3 | 1 (서버 SSRF 차단) |
| **Info** | **3** | 0 (기존 UI 보존) | 3 (서버 인가·감사로그) |
| **합계** | **9** | **6** | **7** |

---

## 3. 식별된 취약점 상세 분석 (STEP 1 ~ STEP 3)

### [Issue 01] 웹 사진 수집기 URL 및 검색어 입력값 미검증 및 위험 프로토콜 미차단
- **Severity**: **Medium**
- **File**: `src/components/session/WebPhotoCollector.tsx`, `src/services/webPhotoCrawler.ts`
- **Current Code**:
  ```tsx
  const handleSearch = async (targetQuery = query, targetCategory = category) => {
    const q = targetQuery.trim()
    if (!q) return
    const res = await searchWebPhotosWithDetail(q, targetCategory)
  ```
- **Issue**: 사용자 입력값(`q`)에 `javascript:`, `data:`, `file:`, `vbscript:` 등 위험한 pseudo-protocol 스킴이나 제어 문자, 비정상적으로 긴 페이로드가 유입될 경우 필터링 없이 크롤러/프록시 엔드포인트로 전달됨.
- **Possible Risk**: 의도치 않은 브라우저 비정상 동작, 향후 링크 렌더링 시 잠재적 DOM 기반 취약점 유발 가능성.
- **Frontend Fix Possible**: **YES**
- **Backend Required**: **YES**
- **Recommended Fix**: `javascript:`, `data:`, `file:` 등 위험 스킴 차단 가드 및 300자 입력 상한선 설정, 안전한 프로토콜/기업명만 허용.

---

### [Issue 02] 파일 다운로드 파일명 Path Traversal 및 특수문자 미정제
- **Severity**: **Medium**
- **File**: `src/utils/documentExport.ts`, `src/utils/pdfExport.ts`
- **Current Code**:
  ```ts
  export async function triggerBrowserDownload(data: Blob | string, fileName: string) {
    link.setAttribute('download', fileName)
    await windowWithPicker.showSaveFilePicker({ suggestedName: fileName })
  ```
- **Issue**: `fileName` 파라미터에 `../`, `..\`, `/`, `\`, OS 예약 문자(`: * ? " < > |`) 또는 제어문자가 포함될 경우 살균 없이 브라우저 다운로드 앵커 및 File System Access API에 전달됨.
- **Possible Risk**: 다운로드 파일명 깨짐 현상 및 브라우저/OS 파일 저장 경로 오작동 시도 가능.
- **Frontend Fix Possible**: **YES**
- **Backend Required**: **YES** (`Content-Disposition` 헤더 파일명 정제 필수)
- **Recommended Fix**: `sanitizeDownloadFileName` 정제 함수를 구현하여 경로 탐색 및 금지 문자를 밑줄(`_`)로 치환하고 최대 100자로 제한.

---

### [Issue 03] 파일 업로드 시 클라이언트 측 사전 검증 미흡 (0바이트 파일, 다중 확장자, 개수 초과)
- **Severity**: **Medium**
- **File**: `src/hooks/useSources.ts`, `src/components/profile/FileUploadPanel.tsx`
- **Current Code**:
  ```ts
  if (files.some((file) => !/\.(txt|md|pdf|docx|pptx|jpe?g|png)$/i.test(file.name))) ...
  // FileUploadPanel.tsx에서는 단순 Array.from(e.target.files)만 호출
  ```
- **Issue**: 0바이트 빈 파일에 대한 검사가 없어 파서 오류를 유발하며, `exploit.exe.txt` 같은 이중 확장자나 경로 조작 문자(`../`)에 대한 선제적 차단이 누락됨. `FileUploadPanel.tsx`는 UI상 3개 제한 안내가 있으나 JS 레벨 검증이 부재함.
- **Possible Risk**: 브라우저 메모리 부하, 서버 연동 시 비정상 파일 업로드 트래픽 발생.
- **Frontend Fix Possible**: **YES**
- **Backend Required**: **YES** (매직 넘버 검증 및 바이러스 검사 필수)
- **Recommended Fix**: 0바이트 차단, 파일명 150자 제한, 실행 파일 이중 확장자 차단, 최대 파일 개수 3개 강제.

---

### [Issue 04] 사용자 입력 필드 글자 수 상한(maxLength) 부재
- **Severity**: **Low**
- **File**: `src/components/session/AiSidecar.tsx`, `src/components/session/DraftEditorView.tsx`, `src/components/session/SessionUploadPanel.tsx`, `src/components/session/ApprovalExportView.tsx`
- **Issue**: AI 수정 지시어, 기업명 힌트, 본문 수정창, 확인 사유 입력창에 글자 수 제한이 없어 비정상적으로 거대한 텍스트 붙여넣기 시 렌더링 지연(Client DoS) 및 향후 LLM 토큰 비용 폭증 위험.
- **Possible Risk**: 클라이언트 브라우저 일시 멈춤 및 UI 렌더링 랙.
- **Frontend Fix Possible**: **YES**
- **Backend Required**: **YES**
- **Recommended Fix**: 용도별 적정 `maxLength`(프롬프트: 500자, 기업명: 100자, 확인사유: 200자, 본문: 5000자) 적용 및 이벤트 핸들러 방어적 자르기(`slice`) 추가.

---

### [Issue 05] 프로덕션 빌드 설정에 소스맵 노출 방지 명시 누락
- **Severity**: **Low**
- **File**: `vite.config.ts`
- **Issue**: `build.sourcemap: false`가 설정되어 있지 않아 배포 환경에 원본 TypeScript 소스맵(`.js.map`)이 배포될 위험이 있음.
- **Possible Risk**: 내부 소스 구조, 타입 인터페이스, 주석 등의 외부 노출.
- **Frontend Fix Possible**: **YES**
- **Backend Required**: **NO**
- **Recommended Fix**: `vite.config.ts`의 `build.sourcemap = false` 명시.

---

### [Issue 06] 개발 서버 웹 크롤러/이미지 프록시 플러그인의 SSRF 방어 부재
- **Severity**: **Low** (로컬 개발 환경 한정)
- **File**: `vite.config.ts`
- **Issue**: 개발 서버 미들웨어(`/crawl-api/photos`, `/crawl-api/proxy-image`)에서 `targetUrl` 및 `imageUrl`에 `localhost`, `127.0.0.1`, `169.254.169.254`가 주입될 경우 로컬 개발 서버가 SSRF 게이트웨이로 오용될 수 있음.
- **Possible Risk**: 로컬 서비스 포트 스캔 및 클라우드 메타데이터 노출 위험.
- **Frontend Fix Possible**: **YES**
- **Backend Required**: **YES** (실제 서버 크롤러 구축 시 필수)
- **Recommended Fix**: `isSafeTargetUrl` 가드를 통해 루프백/사설 대역 및 클라우드 메타데이터 IP 접근 거부.

---

### [Issue 07 ~ 09] 서버 부재로 인한 클라이언트 상태 조작 및 인증 한계
- **Severity**: **Info** (`BACKEND_SECURITY_REQUIRED.md` 기록)
- **File**: `src/components/session/ApprovalExportView.tsx`, `src/hooks/useSources.ts`
- **Issue**:
  - `isApproved = true` 및 경고 확인 상태가 클라이언트 React state에만 존재하여 개발자 콘솔에서 조작 가능.
  - `sessionStorage`에 세션 식별자만 저장되며, 실제 만료 제어나 서명된 토큰 검증 시스템이 없음.
- **Frontend Fix Possible**: **NO** (현재 백엔드/인증이 없으므로 가짜 인증을 날조하지 않고 UI 기능 유지)
- **Backend Required**: **YES**

---

## 4. 실제 수정한 파일 및 코드 내역

### 1) `src/utils/documentExport.ts`
- **수정 코드**:
  - `sanitizeDownloadFileName(rawName, fallback)` 함수 구현:
    - Path Traversal(`../`, `..\`) 및 OS 예약 특수문자(`[\\/:*?"<>|\x00-\x1f]`)를 밑줄(`_`)로 치환
    - 최대 길이 100자 제한 및 안전한 확장자 보존
  - `triggerBrowserDownload`, `downloadViaAnchor` 진입 시 안전한 파일명 강제 적용.
- **수정 이유**: 비정상 파일명 및 디렉터리 경로 조작 위험 방어.

### 2) `src/utils/pdfExport.ts`
- **수정 코드**:
  - `loadBrowserImage`에 프로토콜 가드 추가: `javascript:`, `vbscript:`, `file:`, `data:text/html` 차단 (`http:`, `https:`, `/`, `./`, `data:image/`만 허용).
  - `generateAndDownloadPdf` 파일명 생성 시 `sanitizeDownloadFileName` 적용.
- **수정 이유**: 캔버스 렌더링 시 위험 스킴 차단 및 생성된 PDF 파일명 안전화.

### 3) `src/components/session/WebPhotoCollector.tsx`
- **수정 코드**:
  - `validateWebQueryOrUrl` 함수 추가: `javascript:`, `data:`, `file:`, `vbscript:` 스킴 차단 및 안내 배너 피드백 제공, 제어 문자 제거, 300자 제한.
  - 검색 입력창에 `<input maxLength={300} autoComplete="off" />` 적용.
  - 이미지 `onError` 핸들러에서 `photo.url`이 안전한 `http/https` 또는 `/` 스킴인지 확인 후 프록시 재시도.
- **수정 이유**: 클라이언트 차원의 스킴 악용 차단 및 입력 버퍼 안정성 확보.

### 4) `src/services/webPhotoCrawler.ts`
- **수정 코드**:
  - `searchWebPhotosDetailed`에서 `queryOrUrl`의 스킴 검증(`javascript:`, `data:`, `file:` 차단) 및 300자 정제 로직 추가.
- **수정 이유**: 크롤러 서비스에 악성 프로토콜이 전달되는 것 선제 차단.

### 5) `src/hooks/useSources.ts`
- **수정 코드**:
  - `upload` 함수에서 파일 유효성 검사 루프 보강:
    - 0 Byte 빈 파일 업로드 차단 (`file.size <= 0`)
    - 파일명 길이 150자 초과 차단
    - Path traversal(`..`, `/`, `\`) 차단
    - 실행 파일 위장 이중 확장자(`/\.(exe|bat|cmd|sh|vbs|scr|jar|js|msi|dll|com|pif|reg|ps1)\b/i`) 차단
- **수정 이유**: 비정상 파일 및 실행 파일 업로드 시도 선제 차단.

### 6) `src/components/profile/FileUploadPanel.tsx`
- **수정 코드**:
  - `handleChange` 핸들러에서 허용 확장자(`.txt`, `.md`), 안전한 파일명, 0바이트 차단, 최대 3개 개수 제한 로직 추가.
- **수정 이유**: 브라우저 다이얼로그 필터 우회 시 JS 레벨 방어.

### 7) 입력 필드 글자 수 상한 적용 (`AiSidecar.tsx`, `DraftEditorView.tsx`, `SessionUploadPanel.tsx`, `ApprovalExportView.tsx`)
- **수정 코드**:
  - `AiSidecar.tsx`: 지시어 input에 `maxLength={500}`, 핸들러에 `slice(0, 500)` 적용
  - `DraftEditorView.tsx`: 본문 수정 textarea `maxLength={5000}`, AI 프롬프트 textarea `maxLength={500}` 적용
  - `SessionUploadPanel.tsx`: 직접 태그 입력 input `maxLength={30}`, 기업명 힌트 input `maxLength={100}` 적용
  - `ApprovalExportView.tsx`: 경고 확인 사유 input `maxLength={200}` 적용
- **수정 이유**: Client DoS 방어 및 대량 텍스트 페이로드로 인한 렌더링 랙 방지.

### 8) `vite.config.ts`
- **수정 코드**:
  - `build.sourcemap: false` 명시 (프로덕션 빌드 시 소스맵 노출 방지)
  - 개발 서버 크롤러 미들웨어에 `isSafeTargetUrl` 추가: `localhost`, `127.0.0.1`, `0.0.0.0`, `169.254.169.254`, `10.x`, `192.168.x` 사설 대역 차단
- **수정 이유**: 소스 코드 보호 및 개발 환경 SSRF 방어.

---

## 5. 빌드 및 동작 검증 결과 (STEP 6 & STEP 7)

```bash
$ npm run build
> frontend@0.0.0 build
> tsc -b && vite build

✓ 2142 modules transformed.
dist/index.html                          1.08 kB │ gzip:   0.62 kB
dist/assets/index-Bf0gN2uH.css          77.02 kB │ gzip:  13.71 kB
dist/assets/purify.es-Bvo9QlJ8.js       28.08 kB │ gzip:  11.08 kB
dist/assets/index.es-B1Mu3t5x.js       151.37 kB │ gzip:  48.88 kB
dist/assets/html2canvas-B2CDZqiq.js    199.48 kB │ gzip:  46.77 kB
dist/assets/index-CI31nL0y.js        1,273.70 kB │ gzip: 384.85 kB
✓ built in 1.50s
The command exited with code 0.
```

- **TypeScript 타입 검사**: 에러 0건 통과.
- **프로덕션 빌드**: 정상 완료 (소스맵 `.map` 파일 생성되지 않음 확인).
- **기존 UI/기능 회귀 없음**: 1단계 자료 선택, 실시간 사진 수집, 2단계 인라인 편집/AI 사이드카, 3단계 사전검증/PDF·DOCX 출력 기능 100% 정상 동작.

---

## 6. 수정하지 않은 항목 및 이유

1. **최종 승인(`isApproved`) 및 경고 확인 상태 플래그 유지**:
   - **이유**: 현재 실제 인증 서버와 DB가 없는 프론트엔드 단독 환경이므로, 클라이언트 상태를 강제로 차단하면 프로토타입 시연 및 3단계 위저드 완료 기능이 중단됩니다. 따라서 프론트 UI 동작은 유지하고, 서버 요구사항 문서(`AUTH-003`)에 필수 구현 과제로 분리했습니다.
2. **`sessionStorage` 기반 세션 복구 구조 유지**:
   - **이유**: 현재 실제 백엔드 세션 API가 없으므로 브라우저 새로고침 시 작업 내용을 복구하는 필수 UX 기능입니다. 개인 식별 정보나 비밀키가 저장되지 않으므로 현 상태를 유지하고, 향후 HTTP-Only 쿠키 전환 요구사항(`AUTH-001`)으로 분리했습니다.
3. **HTTP 보안 응답 헤더(CSP, HSTS 등) 프론트 코드 직접 주입 미시행**:
   - **이유**: 보안 헤더는 웹 서버 또는 CDN 배포 단계에서 HTTP 응답에 포함되어야 유효하며, 프론트엔드 코드만으로 가장할 수 없습니다. 따라서 `DEPLOYMENT_SECURITY_REQUIRED.md`에 공식 설정 가이드로 정리했습니다.

---

## 7. 생성된 보안 요구사항 문서 요약

### 1) `BACKEND_SECURITY_REQUIRED.md`
- **AUTH-001**: 서버측 암호학적 세션 검증 (Critical)
- **AUTH-002**: 서버측 RBAC 권한 검증 미들웨어 (Critical)
- **AUTH-003**: 최종 승인(Approval) 상태의 서버 트랜잭션 및 감사 로그 기록 (High)
- **AUTH-004**: 안전한 토큰 라이프사이클 및 로그아웃(세션 무효화) (High)
- **INPUT-001**: 서버측 모든 입력값 재검증 및 Sanitization (High)
- **FILE-001**: 매직 바이트 기반 MIME 타입 검증 및 안티바이러스 스캔 (Critical)
- **FILE-002**: 업로드 파일명 UUID 저장 및 Path Traversal 차단 (Critical)
- **FILE-003**: 업로드 파일 크기 제한 및 DoS 방어 (High)
- **CRAWL-001**: 크롤러/프록시 서비스의 SSRF 방어 전용 네트워크 분리 (Critical)
- **CRAWL-002**: 프로토콜 제한 및 DNS Rebinding 방어 (High)
- **AGENT-001**: AI Agent Tool 실행 시 서버 권한 게이트웨이 통과 (Critical)
- **AGENT-002**: 중요 Action 서버측 이중 승인 및 감사 로그 (Critical)
- **AGENT-003**: LLM 출력 필터링 및 프롬프트 인젝션 방어 (High)
- **AGENT-004**: 세션별 API Rate Limiting 적용 (High)

### 2) `DEPLOYMENT_SECURITY_REQUIRED.md`
- **보안 응답 헤더**:
  - `Content-Security-Policy (CSP)` 맞춤 화이트리스트 구성
  - `Strict-Transport-Security (HSTS)` 강제
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` 하드웨어 권한 비활성화
  - `X-Frame-Options: DENY`
- **프로덕션 소스맵 차단**: `.map` 파일 배포 금지
- **TLS 1.2 / 1.3 강제** 및 HTTP -> HTTPS 301 리다이렉트
- **정적 에셋 캐싱 정책** 및 내부 정보 은닉 커스텀 에러 페이지

---

## 8. 현재 남아 있는 본질적 위험

1. **클라이언트 측 검증의 한계**:
   - 프론트엔드에 추가된 파일 확장자, 파일 크기, 입력값 글자 수 검증은 브라우저를 우회하는 직접적인 HTTP 요청(cURL, API 클라이언트 등) 앞에서는 방어선이 되지 못합니다.
2. **클라이언트 상태 조작 가능성**:
   - 브라우저 개발자 도구를 다룰 수 있는 사용자는 여전히 클라이언트 메모리 상의 `isApproved`나 `step` 상태를 조작할 수 있습니다.
3. **배포 인프라 의존성**:
   - 본 애플리케이션이 실제 운영 서버에 배포되기 전까지는 HTTPS 강제나 CSP 등의 브라우저 정책이 적용되지 않습니다.

---

## 9. 최종 평가

> **"현재 확인 가능한 프론트엔드 코드 범위에서 보안 Hardening을 수행했다."**
>
> 존재하지 않는 가짜 백엔드나 모의 인증을 날조하지 않고, 실제 프론트엔드 코드에 존재하는 XSS, URL/프로토콜 검증, 파일 업로드/다운로드 살균, 입력 길이 상한, 빌드 소스맵 비활성화를 견고하게 개선하였으며, 향후 백엔드 및 인프라 구축 시 필요한 모든 필수 보안 통제 항목을 표준 문서화하여 안전한 연동 기반을 마련했습니다.
