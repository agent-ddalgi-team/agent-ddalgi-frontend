# DEPLOYMENT_SECURITY_REQUIRED.md
> **문서 목적**: 본 문서는 본 프론트엔드 애플리케이션을 실제 웹 서버(Nginx, Cloudflare, AWS CloudFront, Vercel 등) 및 운영 환경에 배포할 때 반드시 설정해야 하는 인프라 및 네트워크 보안 요구사항을 명시합니다.
> **전제 조건**: 현재 로컬 Vite 개발 환경에서는 실제 운영용 보안 HTTP 응답 헤더가 주입되지 않으므로, 배포 시 웹 서버/CDN 설정 계층에서 아래 정책을 적용해야 합니다.

---

## 1. 보안 HTTP 응답 헤더 (Security Headers)

배포 웹 서버(Nginx / Apache / Caddy / Cloudflare Rules / AWS CloudFront Response Headers Policy)에서 모든 정적 파일 및 HTML 응답에 다음 헤더를 필수로 포함해야 합니다:

### 1) Content-Security-Policy (CSP)
```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://images.unsplash.com https://commons.wikimedia.org https://upload.wikimedia.org; connect-src 'self' https://commons.wikimedia.org; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';
```
- **해설**:
  - `default-src 'self'`: 기본 리소스는 자체 오리진에서만 허용.
  - `img-src`: 이미지 프리뷰 및 Unsplash/Wikimedia 정적 사진 로딩을 위해 지정된 도메인만 허용.
  - `frame-ancestors 'none'`: 제3자 사이트의 iframe 삽입(Clickjacking 공격)을 방지.
  - `object-src 'none'`: 플래시나 자바 애플릿 등 플러그인 실행 완전 차단.

### 2) Strict-Transport-Security (HSTS)
```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
- **해설**: 브라우저가 평문 HTTP로 접속하는 것을 방지하고 항상 HTTPS 암호화 연결을 강제(2년간 캐싱 및 HSTS Preload 리스트 등록 지원).

### 3) X-Content-Type-Options
```http
X-Content-Type-Options: nosniff
```
- **해설**: 브라우저의 MIME 타입 스니핑을 방지하여 스크립트가 아닌 파일(예: 텍스트, 이미지)이 스크립트로 실행되는 위험 차단.

### 4) Referrer-Policy
```http
Referrer-Policy: strict-origin-when-cross-origin
```
- **해설**: 외부 사이트로 이동하거나 외부 리소스를 호출할 때 민감한 URL 경로 정보 노출 방지.

### 5) Permissions-Policy
```http
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=()
```
- **해설**: 브라우저의 불필요한 하드웨어 권한(카메라, 마이크, 위치 등)을 명시적으로 비활성화하여 악성 스크립트의 권한 오용 차단.

### 6) X-Frame-Options
```http
X-Frame-Options: DENY
```
- **해설**: 구형 브라우저 대상 Clickjacking 방지 (CSP `frame-ancestors 'none'`의 폴백).

---

## 2. 프로덕션 빌드 및 소스맵 (Source Maps & Build Artifacts)

- **Production Source Map 차단**:
  - `vite.config.ts`에 `build: { sourcemap: false }`가 설정되어 배포 산출물(`dist/`)에 `.js.map` 파일이 생성되지 않습니다.
  - CI/CD 파이프라인에서 `.map` 파일이 웹 서버 공개 디렉터리에 배포되지 않는지 재확인해야 합니다.
- **불필요한 파일 서빙 차단**:
  - 배포 루트에 `.git`, `.env*`, `package.json`, `README.md`, `tsconfig.json` 등의 내부 파일이 서빙되지 않도록 웹 서버 규칙 설정 필요:
  ```nginx
  location ~ /\.(?!well-known).* {
      deny all;
  }
  ```

---

## 3. 전송 계층 보안 (TLS / HTTPS)

- 최신 TLS 1.2 및 TLS 1.3만 허용 (TLS 1.0, 1.1 및 취약한 암호 스위트 비활성화).
- 유효한 공인 SSL/TLS 인증서(Let's Encrypt, Cloudflare Managed SSL 등) 적용 및 자동 갱신 구성.
- 포트 80(HTTP)으로 들어오는 모든 트래픽은 포트 443(HTTPS)으로 301 Permanent Redirect 처리.

---

## 4. 캐싱 및 에러 페이지 (Caching & Error Pages)

- **정적 에셋 캐싱 정책**:
  - 해시가 포함된 번들 파일(`dist/assets/*`): `Cache-Control: public, max-age=31536000, immutable`
  - 엔트리 HTML(`dist/index.html`): `Cache-Control: no-cache, no-store, must-revalidate`
- **커스텀 에러 페이지**:
  - 404, 500, 502 등의 HTTP 오류 발생 시 내부 서버 경로, 웹 서버 버전 정보(Server Tokens), 프레임워크 스택 트레이스가 드러나지 않는 정적 에러 페이지 서빙.
  - Nginx 설정 예: `server_tokens off;`
