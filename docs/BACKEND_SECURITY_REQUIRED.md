# BACKEND_SECURITY_REQUIRED.md
> **문서 목적**: 본 문서는 프론트엔드 코드베이스의 보안 감사 결과, 클라이언트 단독으로는 통제할 수 없으며 향후 백엔드 및 인증 서버 구축 시 반드시 서버측에 구현해야 하는 필수 보안 요구사항을 정의합니다.
> **전제 조건**: 현재 프로젝트에는 실제 백엔드 소스코드, 데이터베이스, API Key, Secret Key 및 실제 서버 인증 시스템이 존재하지 않으며, 프론트엔드 클라이언트 상태 검증만으로는 보안 통제를 완성할 수 없습니다.

---

## 1. 인증 및 권한 통제 (Authentication & Authorization)

### AUTH-001
- **Requirement**: 사용자 인증 여부 및 세션 검증은 반드시 서버측(API Gateway / Auth Server)에서 암호학적으로 검증된 세션 또는 서명된 토큰(예: HTTP-Only, Secure, SameSite Cookie 기반)으로 통제해야 함.
- **Reason**: 클라이언트 브라우저(`sessionStorage`, 메모리 상태)에 저장된 값은 사용자가 개발자 도구를 통해 임의 조작이 가능하므로 보안 경계(Security Boundary)로 간주할 수 없음.
- **Priority**: Critical

### AUTH-002
- **Requirement**: 관리자 및 사용자 권한(Role-Based Access Control, RBAC)은 서버측 미들웨어에서 인가(Authorization)를 수행해야 함.
- **Reason**: 프론트엔드에서 UI 버튼을 숨기거나 특정 상태(`isAdmin`, `role`)를 확인하는 것은 단순 화면 표출 제어일 뿐이며, 권한이 없는 사용자가 직접 API를 호출하는 것을 차단할 수 없음.
- **Priority**: Critical

### AUTH-003
- **Requirement**: 최종 문서 승인(Approval) 상태 및 검토 완료 처리는 서버에서 감사 로그(Audit Trail)와 함께 서명/저장되어야 함.
- **Reason**: 현재 프론트엔드의 `isApproved` 체크박스 및 `status === 'acknowledged'` 상태는 브라우저 메모리 상의 플래그에 불과하여 위변조가 가능함. 실제 공식 문서 배포 승인은 서버측 트랜잭션으로 기록되어야 법적·업무적 무결성을 보장할 수 있음.
- **Priority**: High

### AUTH-004
- **Requirement**: 안전한 토큰 라이프사이클 및 로그아웃(세션 무효화) 처리 구현.
- **Reason**: 프론트엔드 스토리지 초기화(`forget()`)만으로는 서버에 발행된 토큰을 즉시 무효화할 수 없으므로, 토큰 블랙리스트 또는 짧은 유효기간의 Access Token + 회전식 Refresh Token 구조가 필요함.
- **Priority**: High

---

## 2. 사용자 입력값 및 파일 검증 (Input & File Validation)

### INPUT-001
- **Requirement**: 프론트엔드 입력 검증과 무관하게, 서버로 유입되는 모든 텍스트, 쿼리, URL, 파라미터는 서버측에서 엄격하게 재검증 및 Sanitization을 수행해야 함.
- **Reason**: 프론트엔드 유효성 검사(`maxLength`, 스킴 필터, 정규식 등)는 브라우저 외부 도구(cURL, Postman, 공격 스크립트)를 통해 얼마든지 손쉽게 우회될 수 있음.
- **Priority**: High

### FILE-001
- **Requirement**: 업로드 파일의 매직 바이트(Magic Number) 기반 실제 MIME 타입 검증 및 안티바이러스(AV) 스캔 수행.
- **Reason**: 클라이언트가 전송하는 `Content-Type` 헤더와 파일 확장자는 쉽게 위조될 수 있으며, 악성 스크립트나 매크로가 포함된 문서가 서버 및 타 사용자에게 전파되는 것을 방지해야 함.
- **Priority**: Critical

### FILE-002
- **Requirement**: 업로드된 원본 파일명은 난수화된 식별자(UUID)로 저장하고, 파일 다운로드 시 `Content-Disposition: attachment; filename="..."` 헤더에 Path Traversal 및 인젝션 방어 파일명을 강제해야 함.
- **Reason**: 업로드 파일명이 서버 파일시스템 경로로 직접 사용될 경우 Path Traversal(`../../`) 및 원격 코드 실행(RCE) 위험이 발생함.
- **Priority**: Critical

### FILE-003
- **Requirement**: 업로드 파일 크기 제한 및 DoS(Denial of Service) 방어.
- **Reason**: 대용량 파일 또는 ZIP Bomb 같은 압축 해제 공격을 서버측 리버스 프록시 및 API 계층에서 사전에 크기 제한(예: 10MB)으로 차단해야 함.
- **Priority**: High

---

## 3. 웹 크롤러 및 이미지 프록시 보안 (SSRF Prevention)

### CRAWL-001
- **Requirement**: 웹 사이트 크롤링 및 이미지 프록시 서비스는 전용 아웃바운드 프록시 또는 샌드박스 환경에서 구동하며, 내부망 IP(Private IP, Localhost, Link-Local) 접근을 원천 차단(SSRF 방어)해야 함.
- **Target IP Ranges**:
  - `127.0.0.0/8`, `::1` (Loopback)
  - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Private RFC1918)
  - `169.254.169.254` (Cloud Instance Metadata Service)
  - `0.0.0.0/8`
- **Reason**: 사용자가 입력한 URL을 서버가 대신 가져오는 과정에서 내부 마이크로서비스 또는 클라우드 인프라 자격증명(AWS/GCP 메타데이터)이 탈취될 수 있음.
- **Priority**: Critical

### CRAWL-002
- **Requirement**: 크롤러의 요청 프로토콜을 `http` 및 `https`로만 제한하고, DNS Rebinding 공격 방어를 위한 IP 해석 후 검증(DNS Resolution Pinning) 적용.
- **Priority**: High

---

## 4. AI Agent 및 LLM 보안 (AI Agent Security Framework)

### AGENT-001
- **Requirement**: AI Agent의 Tool/API/함수 호출은 LLM이 직접 실행하지 않고, 서버의 권한 검증(Permission Gate) 및 입력 유효성 검사 계층을 반드시 통과해야 함.
- **Reason**: Prompt Injection 공격을 통해 LLM이 악의적이거나 비인가된 파라미터로 내부 시스템을 호출하는 것을 방지하기 위함.
- **Priority**: Critical

### AGENT-002
- **Requirement**: 문서 승인, 삭제, 외부 발송, DB 변경 등 중요 Action에 대한 서버측 이중 승인(Approval Workflow) 및 감사 로그(Audit Log) 필수.
- **Reason**: AI Agent의 자율 동작으로 인한 데이터 오염, 비인가 변경 및 책임 추적성(Non-repudiation) 결여 방지.
- **Priority**: Critical

### AGENT-003
- **Requirement**: LLM 응답에 대한 출력 필터링(Output Sanitization) 및 탈옥(Jailbreak)/개인정보 유출 방지 계층 구축.
- **Reason**: AI 응답 내에 민감 정보(타사 데이터, 내부 시스템 프롬프트, 개인정보)가 노출되는 것을 사전에 탐지하고 마스킹해야 함.
- **Priority**: High

### AGENT-004
- **Requirement**: 사용자별 및 세션별 API Rate Limiting(호출 빈도 제한) 적용.
- **Reason**: 고비용의 LLM 추론 API 및 크롤링 기능에 대한 무차별 남용과 비용 폭증(Denial of Wallet)을 방어함.
- **Priority**: High
