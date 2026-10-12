import { execSync } from 'child_process';

// 1. git credential을 통해 GitHub 토큰 가져오기
const cred = execSync('git credential fill', {
  input: 'protocol=https\nhost=github.com\n\n',
  encoding: 'utf-8',
});
const tokenMatch = cred.match(/password=(.+)/);
if (!tokenMatch) {
  console.error('GitHub 토큰을 찾을 수 없습니다.');
  process.exit(1);
}
const token = tokenMatch[1].trim();

// 2. PR 제목 및 본문
const title = 'feat(workspace): 편집 세션 보존, 원문 근거 대조, 원클릭 시연 프리셋 및 무중단 UI 강화';

const body = `## 📌 개요
회사소개서 AI 생성 서비스의 사용자가 AI의 생성 내용, 원문 근거, 검증 상태를 직접 확인하고 능동적으로 수정·확인할 수 있도록 프론트엔드 작업 영역(상태 표시, 근거 확인, 편집 보존, 미리보기)과 시연 안정성을 대폭 개선한 PR입니다.

백엔드 코드 수정 없이, 순수 프론트엔드 레벨에서의 상태 복원력(Resilience), RAG 근거 추적 투명성(Explainability), 발표 시연 전용 UX를 통합 구축하였습니다.

---

## 🚀 주요 변경 사항

### 1. 로컬 편집 내용 세션 스토리지 자동 보존 (\`usePublication.ts\`)
- 브라우저 \`sessionStorage\`를 활용해 사용자의 슬라이드 편집(\`edits\`) 및 블록 삭제 설정(\`removed\`) 상태를 실시간 자동 보존
- 페이지 새로고침(F5)이나 탭 이탈 시에도 작성 중이던 텍스트 손실 방지
- 변경 사항 저장 성공 또는 명시적 폐기(\`discard\`) 시에만 스토리지 정리

### 2. S02 원문 근거(EvidenceRef) 및 Fact ID 인스펙터 연동 (\`DocumentWorkspace.tsx\`)
- 선택 블록의 \`EvidenceRef\`(출처 파일명, locator, 원문 발췌문) 및 \`Fact ID\` 카드 제공
- 블록에 걸린 미해결 이슈(Blocker/Warning)를 인라인으로 확인하고 원문과 즉시 대조 가능
- 미선택 시 인터랙션 방법을 안내하는 Empty State 카드 추가

### 3. 실패 단계별 맞춤 재시도 & 오프라인 복구 카드 (\`DocumentWorkspace.tsx\`, \`SourceSelectionView.tsx\`)
- 에러 발생 시 단순 텍스트 알림을 넘어, 실패한 단계에 맞춘 즉각적인 복구 버튼 연동
  - 제공 버튼: \`[문서 변환 다시 시도]\`, \`[내용 검증 다시 실행]\`, \`[배치 검증 다시 실행]\`, \`[출력 파일 다시 준비]\`, \`[상태 새로고침]\`
- 백엔드 미구동 시 네트워크 에러를 친절히 안내하고 **[시연 모드로 즉시 전환]** 퀵 액션 카드 제공

### 4. 시연 전용 원클릭 페르소나 프리셋 탑재 (\`SourceSelectionView.tsx\`)
- 발표 및 시연 시 사용자 입력 피로도를 없애기 위해 3대 주요 페르소나 퀵 칩 추가:
  - 🏭 **생산기술 담당자** (정량 설비 스펙 및 공정 수율 중심)
  - 🛡️ **품질 담당자** (ISO 인증 및 품질 보증 체계 중심)
  - 🤝 **신규 고객 제안** (투자 유치 및 시장 경쟁력 중심)

### 5. 무중단 2중 React Error Boundary 및 모드 토글러 (\`ErrorBoundary.tsx\`, \`App.tsx\`, \`main.tsx\`)
- 전역(\`main.tsx\`) 및 메인 뷰(\`App.tsx\`)를 감싸는 2중 Error Boundary 컴포넌트 신규 구현
- 예기치 못한 런타임 렌더링 에러 발생 시에도 앱 크래시를 차단하고 3대 복구 액션 제공 (\`다시 시도\`, \`시연 모드로 복구\`, \`캐시 초기화\`)
- 상단 글로벌 헤더에 **\`[🧪 시연 모드]\` ↔ \`[🌐 서버 모드]\`** 원클릭 토글러 배치

### 6. 발표용 키보드 단축키 및 프리미엄 UI 리뉴얼 (\`DocumentWorkspace.tsx\`, \`StepIndicator.tsx\`)
- **실전 단축키**: \`Ctrl+S\` (로컬 저장 토스트), \`←\`/\`→\` (슬라이드 넘김), \`ESC\` (인스펙터 닫기)
- 하단 고정 독 반응형 여백 최적화 및 단축키 안내 뱃지 추가
- 스텝 인디케이터 서브타이틀 및 모던 체크마크 디자인 적용

### 7. 발표 시연 3분 매뉴얼 치트시트 가이드 (\`docs/DEMO_PRESENTATION_SCRIPT.md\`)
- 타임라인별 화면 조작, 발표 멘트, 기술 소구 포인트, 심사위원 Q&A 대응 가이드 수록

---

## 🧪 자체 빌드 및 검증 결과

- **TypeScript / Vite 프로덕션 빌드**: \`tsc -b && vite build\` 오류 0건 통과 (Exit Code 0)
- **로컬 시연 모드**: \`http://localhost:5173/?preview=1\` S01~S03 전 구간 무결점 동작 확인
- **안정성 검증**: 오프라인 상태 및 의도적 예외 상황에서 에러 바운더리 정상 복구 확인

---

## 📦 포함된 커밋 내역
- \`c5c42a2\` feat(workspace): 편집 세션 보존, 실패 재시도 액션 및 원문 근거 대조 UI 추가
- \`4528716\` feat(ui): 원클릭 시연 프리셋, 에러 바운더리, 발표 단축키 및 UI 리뉴얼
- \`315eae4\` docs: 발표 시연 3분 조작 멘트 치트시트 및 Q&A 가이드 추가
`;

// 3. fetch로 GitHub PR PATCH 요청
async function updatePR() {
  try {
    const response = await fetch('https://api.github.com/repos/agent-ddalgi-team/agent-ddalgi-frontend/pulls/26', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Node-Update-PR',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body }),
    });

    if (response.ok) {
      const json = await response.json();
      console.log('✅ PR #26 업데이트 성공!');
      console.log(`URL: ${json.html_url}`);
      console.log(`Title: ${json.title}`);
    } else {
      const errText = await response.text();
      console.error(`❌ PR 업데이트 실패: HTTP ${response.status}`);
      console.error(errText);
    }
  } catch (err) {
    console.error('네트워크 에러:', err);
  }
}

updatePR();
