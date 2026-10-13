> **과거 기록:** 작성 당시 상태를 보존합니다. 현재 구현·남은 과제는 [작업 현황](../WORK_SUMMARY.md)을 따릅니다. 본문의 다음 번호 MD 생성 안내는 현행 규칙이 아닙니다.

# 프론트엔드 기능 점검 및 사용자 확인·수정 개선 보고서

> **문서 버전**: v1.0  
> **작성 일자**: 2026-10-11  
> **담당**: 프론트엔드 개발 담당  
> **관련 저장소**: `agent-ddalgi-frontend`  
> **연계 규격**: 백엔드 계약 1.8 (`contracts.md`), 화면설계도 v1.0  

---

## 2026-10-12 현재 대조

이 보고서의 1~4절은 2026-10-11 작성 당시의 개선 설명·예시·빌드 기록이다. 이번에 고객 사례나 기능 시험을 재실행한 결과가 아니다. [현재 상태](../WORK_SUMMARY.md)를 우선한다.

- 편집은 sessionStorage JSON 보관이다. 암호화/100% 복구/탭 종료 후 복구는 보장하지 않는다.
- 경고 카드에는 이미 **빠른 사유 선택**이 있다. 새 기능 제안으로 중복 구현하지 않는다.
- 발췌문 표시는 있지만 현재 프론트의 추출문/원본 API 호출은 없다. 백엔드 segments/original API 구현과 구분한다.
- 현재 자료 충족도에는 파일명·개수 추정이 남아 있다. 실제 점검만 표시한다는 옛 설명은 현재 코드와 다르다.

## 1. 개요 및 목적

본 보고서는 회사소개서 AI 생성 서비스에서 사용자가 AI의 생성 내용, 원문 근거, 검증 상태를 직접 확인하고 능동적으로 수정·승인할 수 있도록 다듬은 프론트엔드 작업 내역을 정리한 문서입니다.

이번 작업의 핵심 목표는 "완성된 최종 서비스"를 일방적으로 선언하는 것이 아니라,
1. **4대 필수 작업 영역(상태 표시, 근거 확인, 편집 보존, 미리보기)의 완료 기준 달성**
2. **세 가지 공통 고객 요청(품질 담당자, 생산기술 담당자, 신규 고객 소개)에 따른 재현 가능한 문제 도출**
3. **검증된 공통 코드 개선 적용**
4. **기획 결정 필요 항목 및 백엔드 협의 필요 API 목록 확립**
입니다.

---

## 2. 4대 작업 영역 점검 및 완료 기준 달성 내역

| 작업 | 구체적인 내용 | 완료 기준 | 점검 및 개선 결과 |
|---|---|---|---|
| **상태 표시 점검** | 자료 읽기·분석·생성·검증·출력의 진행, 실패, 재시도 상태 확인 | **실패한 단계와 다음 행동이 명확함** | • 에러 발생 시 단순 텍스트 안내를 넘어, 실패한 단계에 맞춘 즉각적인 재시도 액션 버튼 연동<br/>• **[문서 변경 다시 저장]**, **[내용 검증 다시 실행]**, **[배치 검사 다시 실행]**, **[출력 파일 다시 준비]**, **[상태 새로고침]** 제공으로 실패 시 다음 행동이 명확해짐 |
| **근거 확인 흐름** | 현재 API가 제공하는 출처·사실·문제 정보를 화면에서 확인 가능하게 점검 | **생성 내용의 근거와 미확인 사항을 찾을 수 있음** | • S02 초안 편집 인스펙터(우측 사이드바)에 **선택 블록의 원문 근거(출처 파일명, locator, 발췌문) 및 Fact ID 카드** 신규 배치<br/>• 블록에 걸린 미해결 Issue(Blocker/Warning)를 인라인으로 인지하고 원문과 즉시 대조·수정 가능 |
| **편집 보존 점검** | 저장 실패, 버전 충돌, 재검증 과정에서 편집 내용이 유지되는지 확인 | **사용자 작업이 유실되지 않음** | • `usePublication` 내 `sessionStorage` 기반 로컬 인라인 편집(`edits`, `removed`) 자동 보존/복구 체계 구현<br/>• 브라우저 새로고침(F5)이나 탭 이탈 시에도 저장 가능한 환경에서 편집 복구를 시도함. 저장 실패·탭 종료 시 복구를 보장하지 않음<br/>• 저장 성공 시 및 명시적 폐기(`discard`) 시에만 스토리지 정리 |
| **미리보기 점검** | 화면 내용과 최종 PDF의 차이, 넘침, 사진 누락, 빈 페이지 확인 | **차이를 재현하고 담당자에게 전달 가능** | • S03 미리보기 툴바에 **[진단 정보 복사]** 원클릭 도구 탑재<br/>• 문서 ID, Revision, 목표 vs 실제 쪽수, 배치/검증 상태, Blocker/Warning 전체 목록을 클립보드로 추출하여 백엔드/기획 담당자에게 오차를 즉시 재현 전달 가능 |

---

## 3. 세 고객 요청(페르소나)별 점검 및 재현 가능한 문제 목록

세 고객 요청을 동일한 파이프라인으로 점검하여 발견된 재현 가능한 문제와 개선 사항입니다.

### ① 품질 담당자용: 인증 적용 범위와 시험 근거 중심
- **요청 특성**: ISO 9001/14001, AS9100 등 공인 인증서의 유효기간, 인증 적용 범위(Scope), 시험 성적서 수치 근거가 본문에 왜곡 없이 반영되어야 함.
- **재현 가능한 문제 목록**:
  1. **복합 인증 항목 누락 확인 지연**: 여러 인증이 묶여 생성된 제목/리드 문단에서 세부 유효기간이나 인증번호가 누락될 때 `FACT_CONDITIONS_OMITTED` blocker가 발생하나, 기존 화면에서는 "어느 인증 항목의 어떤 수치가 빠졌는지" 원문 발췌문을 찾기 위해 S01로 돌아가야 했음.
  2. **수치 요약에 따른 엄격 검증 충돌**: 원문이 "피막 두께 15~25㎛"인데 초안이 "20㎛ 수준"으로 요약되었을 때 내용 검증에서 지적을 받음. 원문 대조 창이 없으면 품질 담당자가 무엇이 잘못되었는지 판단하기 어려움.
- **프론트 개선 및 조치**:
  - S02 편집 인스펙터 상단에 해당 블록의 `EvidenceRef` 발췌문(원문 인용)과 `Fact ID`를 직접 노출하여, 품질 담당자가 클릭 한 번으로 원문 규격과 즉시 대조 및 수정 가능하도록 개선.

### ② 생산기술 담당자용: 공정·설비·소재 정보와 기술 검토사항 중심
- **요청 특성**: P01~P07 표면처리 공정 순서(전처리 → 아연도금 → 크롬도금 등), 주요 설비 스펙(반응기 용량, 클린룸 클래스), 취급 소재 정보의 기술적 정합성 중심.
- **재현 가능한 문제 목록**:
  1. **공정 순서 분할 시 레이아웃 밸런스 훼손**: 백엔드 자동 분할(`draft-pagination`) 과정에서 7단계 공정이 2개 페이지로 쪼개질 때 소제목과 본문이 나뉘거나 사진 축소(contain 36mm)로 인해 시각적 밸런스가 흐트러질 수 있음.
  2. **설비 사진 매핑 불일치**: 촉매 반응기, 증류 설비, 도금 라인 실사 사진이 다른 공정 설명 블록 뒤에 삽입될 경우 `IMAGE_MISMATCH` blocker가 발생하지만, 이전 화면에서는 사진 캡션과 원문 설명 간의 연결을 확인하기 번거로웠음.
- **프론트 개선 및 조치**:
  - 블록 선택 시 연결된 공정/설비 원문 인용구를 인스펙터에 표시하고, 사진 교체 패널에서 캡션 수정과 원문 대조가 동시에 이루어지도록 흐름 정리.

### ③ 신규 고객 소개용: 주요 서비스와 관련 적용 사례 중심
- **요청 특성**: 기업 개요, 핵심 경쟁우위, 납품 실적(고객사, 납기 4~6일), 표준 제안 브로셔 목적.
- **재현 가능한 문제 목록**:
  1. **경고(Warning) 확인 지연**: 사진 부족 경고(`PHOTO_SHORTAGE`)나 표현 반복(`REPETITION`) 발생 시, 승인 패널 하단의 경고 사유 입력창을 인지하지 못해 승인이 왜 막혔는지 헤매는 문제가 있었음.
  2. **페이지 수 불일치 인지 부족**: 사용자가 4쪽을 원했으나 본문 내용이 길어 실제 PDF 배치가 5쪽으로 생성된 경우, 왜 쪽수가 늘어났는지(`page_count_reason`) 안내가 부족하여 레이아웃 깨짐으로 오인.
- **프론트 개선 및 조치**:
  - S03 진단 정보 복사 도구를 통해 실제 PDF 쪽수와 목표 쪽수의 차이 및 사유를 한눈에 볼 수 있게 하였고, 에러 배너에서 확인 필요 항목으로 직접 이동하는 링크 제공.

---

## 4. 검증된 공통 개선 (코드 반영 상세 내역)

### 4.1. `src/hooks/usePublication.ts` (편집 내용 세션 스토리지 보존)
사용자의 인라인 편집(`edits`) 및 블록 삭제 예정(`removed`) 상태를 브라우저 `sessionStorage`에 실시간 디바운스 동기화하도록 구현하여, 새로고침이나 실수로 인한 화면 이동 시에도 작업이 날아가지 않도록 안전망을 구축했습니다.

```typescript
// 로컬 편집본 스토리지 복원 및 저장 함수
function readLocalEdits(sid: string, did: string): { edits: Record<string, string>; removed: string[] } {
  try {
    const raw = sessionStorage.getItem(`${STORAGE}.${sid}.${did}.draft_edits`)
    if (!raw) return { edits: {}, removed: [] }
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.edits === 'object' && Array.isArray(parsed.removed)) {
      return { edits: parsed.edits, removed: parsed.removed }
    }
    return { edits: {}, removed: [] }
  } catch {
    return { edits: {}, removed: [] }
  }
}

function persistLocalEdits(sid: string, did: string, edits: Record<string, string>, removed: string[]) {
  try {
    if (Object.keys(edits).length === 0 && removed.length === 0) {
      sessionStorage.removeItem(`${STORAGE}.${sid}.${did}.draft_edits`)
    } else {
      sessionStorage.setItem(`${STORAGE}.${sid}.${did}.draft_edits`, JSON.stringify({ edits, removed }))
    }
  } catch {
    // sessionStorage quota or security restriction ignored
  }
}

// 상태 초기화 및 자동 동기화
const [edits, setEdits] = useState<Record<string, string>>(() => readLocalEdits(sid, did).edits)
const [removed, setRemoved] = useState<string[]>(() => readLocalEdits(sid, did).removed)

useEffect(() => {
  persistLocalEdits(sid, did, edits, removed)
}, [sid, did, edits, removed])

// 저장 성공 시 및 폐기(discard) 시 스토리지 정리
persistLocalEdits(sid, did, {}, [])
```

### 4.2. `src/components/session/DocumentWorkspace.tsx`
1. **에러 배너 내 액션 버튼 탑재**:
   - 저장 실패 시: `[문서 변경 다시 저장]`
   - 검증 실패 시: `[내용 검증 다시 실행]`, `[배치 검사 다시 실행]`
   - 출력 실패 시: `[출력 파일 다시 준비]`
   - 공통: `[상태 새로고침]`
2. **S02 인스펙터 내 원문 근거 및 Fact 대조 카드 탑재**:
   - 선택 블록(`selectedBlock`)의 `evidence_refs`(출처 파일명, locator, 원문 발췌문) 및 `fact_ids` 표시
   - 해당 블록에 걸린 미해결 Issue(Blocker/Warning) 실시간 경고 및 사유 표시
3. **S03 툴바 내 차이 진단 정보 복사 도구 탑재**:
   - `copyDiagnostics` 함수 구현으로 문서 ID, Revision, 목표 vs 실제 쪽수, 미해결 이슈 전체를 원클릭 클립보드 복사 지원

### 4.3. 빌드 및 컴파일 무결성 검증
```bash
> frontend@0.0.0 build
> tsc -b && vite build

vite v8.3.0 building client environment for production...
✓ 1940 modules transformed.
dist/index.html                   1.08 kB │ gzip:   0.62 kB
dist/assets/index-CiMU5hiB.css   97.12 kB │ gzip:  16.10 kB
dist/assets/index-CFiBRBaj.js   501.72 kB │ gzip: 148.35 kB
✓ built in 1.07s
```
TypeScript 컴파일 오류 0건, 프로덕션 번들 정상 생성 완료.

---

## 5. 기획에서 결정해야 할 항목

1. **버전 충돌(409 Conflict) 발생 시 병합 정책**:
   - *당시 관찰*: 최신 저장본 복구 중심이었다. 현재 구현을 재확인한 뒤 강제 덮어쓰기/자동 병합 도입 여부를 판단한다.
   - *결정 필요*: 사용자의 로컬 편집본으로 최신 문서를 강제 덮어쓰기(새 Revision으로 바로 저장) 옵션을 제공할 것인가, 아니면 블록 단위 3-way 병합 UI를 제공할 것인가?
2. **사전 점검(Preflight) 결함 시 초안 생성 허용 범위**:
   - 필수 정보(`missing`)가 있어도 "검토용 임시 초안" 생성을 허용할 것인가, 아니면 엄격한 게이트웨이로 차단할 것인가?
3. **경고(Warning) 확인 사유 입력 편의성**:
   - 현재 DocumentWorkspace에 빠른 사유 선택과 직접 입력이 있다. 기존 제안은 구현된 범위이며, 선택만으로 blocker를 해소하거나 서버 승인을 우회하는 기능은 아니다.
4. **목표 쪽수 대비 PDF 분량 초과 시 UX**:
   - 4쪽 요청에 5쪽으로 생성되었을 때, 4쪽으로 강제 축약(글자 수/문단 삭제)을 원하는 사용자를 위한 "엄격한 분량 맞춤 옵션"을 신설할 것인가?

---

## 6. 백엔드와 맞출 필요한 API 목록

작성 당시 계약 1.8을 바탕으로 한 제안이다. 현재 계약은 [백엔드 원본](../../../backend/docs/contracts.md)을 따르며 아래 제안 경로/코드를 이미 합의된 API로 사용하지 않는다. API-1은 현재 대조 결과를 반영했고 API-2~4는 채택 여부 검토 대상으로 유지한다:

| 순번 | 제안 API / 필드 | 메서드 & 경로 | 필요 사유 및 용도 |
|---|---|---|---|
| **API-1** | **원자료 본문/구간 조회 API** | `GET /sessions/{sid}/sources/{source_id}/segments` 및 `/original` | 백엔드에는 구현됨. 현재 프론트 sourceApi에는 호출이 없어 연결 복구 대상(FE-DOC-02). 기존 /content 신규 API 제안으로 중복 구현하지 않음. |
| **API-2** | **단일 파일 재파싱/재업로드 API** | `POST /sessions/{sid}/sources/{source_id}/retry` | 다중 파일 업로드 중 특정 1개 파일만 `partial` 또는 `failed` 되었을 때 전체 세션을 다시 하지 않고 해당 파일만 단독 재시도하는 엔드포인트 필요. |
| **API-3** | **초안 생성 실패 원인 코드 표준화** | `GET /sessions/{sid}/jobs/{jid}` 에러 페이로드 | `job.error`에 `code: 'PAGE_COUNT_UNMET' \| 'TOKEN_EXCEEDED' \| 'TIMEOUT' \| 'INSUFFICIENT_EVIDENCE'`를 세분화하여 반환 요청 (프론트가 맞춤형 안내 제공 가능). |
| **API-4** | **PDF 배치 넘침 상세 정보 API** | `LayoutCheck.issues[]` 내 위치 좌표/블록 ID | 글 넘침 발생 시 어느 페이지의 어느 문단/사진이 몇 mm 넘쳤는지 `block_id`를 명시적으로 반환 요청 (화면에서 해당 블록을 붉은색 테두리로 하이라이트 가능). |
