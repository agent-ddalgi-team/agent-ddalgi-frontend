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
const title = 'feat(ui): 원클릭 시연 프리셋, 2중 에러 바운더리, 발표 단축키 및 시각적 임팩트 Polish (Confetti/Toast/PDF)';

const body = `## 📌 개요
PR #26(세션 보존 및 원문 근거 대조) 머지 이후, 발표 시연의 시각적 완성도(WOW 임팩트)와 무중단 프론트엔드 안정성을 극대화하기 위해 추가 개발된 2차 고도화 PR입니다.

백엔드 서버 미구동 상태나 돌발 네트워크 에러 상황에서도 시연이 중단되지 않도록 **2중 React Error Boundary**와 **모의 시연 엔진 원클릭 토글러**, 그리고 **원클릭 페르소나 프리셋**과 **실전 발표 단축키**, 나아가 심사위원의 시선을 사로잡는 **마이크로 인터랙션(Confetti/플로팅 토스트/원클릭 고해상도 PDF 다운로드)**을 탑재하였습니다.

---

## 🚀 주요 변경 사항

### 1. 발표 임팩트 극대화 마이크로 인터랙션 신규 구현
- **축하 Confetti 파티클 컴포넌트 (\`Confetti.tsx\`)**: 초안 생성 완료 시 캔버스 기반의 경량·우아한 색종이 폭죽 효과 연출
- **플로팅 인터랙티브 토스트 (\`FloatingToast.tsx\`)**: \`Ctrl+S\` 저장, 시스템 진단 리포트 복사, 텍스트 백업 시 Glassmorphic 체크 알림 피드백
- **원클릭 완성본 PDF 즉시 다운로드 & 인쇄 연동 (\`DocumentWorkspace.tsx\`)**: S02, S03 상단 헤더 및 하단 독에서 복잡한 절차 없이 8쪽 완성형 고해상도 PDF를 즉시 브라우저로 내려받는 퀵 액션 탑재

### 2. 시연 전용 원클릭 페르소나 프리셋 탑재 (\`SourceSelectionView.tsx\`)
- 발표 및 시연 시 사용자 입력 피로도를 없애기 위해 3대 주요 페르소나 퀵 칩 추가:
  - 🏭 **생산기술 담당자** (정량 설비 스펙 및 공정 수율 중심)
  - 🛡️ **품질 담당자** (ISO 인증 및 품질 보증 체계 중심)
  - 🤝 **신규 고객 제안** (투자 유치 및 시장 경쟁력 중심)
- 칩 클릭 시 문서 목적, 타깃 청중, 톤앤매너 폼이 원클릭으로 자동 완성

### 3. 무중단 2중 React Error Boundary 및 모드 토글러 (\`ErrorBoundary.tsx\`, \`App.tsx\`, \`main.tsx\`)
- 전역(\`main.tsx\`) 및 메인 뷰(\`App.tsx\`)를 감싸는 2중 Error Boundary 컴포넌트 신규 구현
- 런타임 렌더링 에러 발생 시 앱 크래시를 차단하고 3대 복구 액션 제공 (\`다시 시도\`, \`시연 모드로 복구\`, \`캐시 초기화\`)
- 상단 글로벌 헤더에 **\`[🧪 시연 모드]\` ↔ \`[🌐 서버 모드]\`** 원클릭 토글러 배치

### 4. 발표용 키보드 단축키 및 UI Polish (\`DocumentWorkspace.tsx\`, \`StepIndicator.tsx\`)
- **실전 단축키 탑재**: \`Ctrl+S\` (로컬 저장 토스트), \`←\`/\`→\` (슬라이드 넘김), \`ESC\` (인스펙터 닫기)
- 인스펙터 미선택 시 Empty State 인터랙션 가이드 카드 노출
- 노트북 및 빔프로젝터 해상도 대비 하단 고정 독 반응형 여백 최적화(\`pb-32 sm:pb-36\`)
- 스텝 인디케이터 서브타이틀 및 모던 체크마크 디자인 적용

### 5. 발표 시연 3분 매뉴얼 치트시트 가이드 (\`docs/DEMO_PRESENTATION_SCRIPT.md\`)
- 타임라인별 화면 조작 순서, 발표 멘트, 기술 소구 포인트, 심사위원 Q&A 대응 가이드 신규 작성

---

## 🧪 자체 빌드 및 검증 결과
- **TypeScript / Vite 프로덕션 빌드**: \`tsc -b && vite build\` 오류 0건 통과 (Exit Code 0)
- **로컬 시연 모드**: \`http://localhost:5173/?preview=1\` S01~S03 전 구간 무결점 동작 확인
`;

// 3. fetch로 GitHub PR PATCH 요청
async function updatePR() {
  try {
    const response = await fetch('https://api.github.com/repos/agent-ddalgi-team/agent-ddalgi-frontend/pulls/27', {
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
      console.log('✅ PR #27 업데이트 성공!');
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
