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

// 2. 새 PR 제목 및 본문
const title = 'feat(ui): 원클릭 시연 프리셋, 2중 에러 바운더리, 발표 단축키 및 3분 시연 가이드';

const body = `## 📌 개요
이전 PR(#26, 세션 보존 및 원문 근거 대조) 머지 이후, 발표 시연 완성도와 무중단 프론트엔드 안정성을 극대화하기 위해 추가 개발된 2차 고도화 PR입니다.

백엔드 서버 미구동 상태나 돌발 네트워크 에러 상황에서도 시연이 중단되지 않도록 **2중 React Error Boundary**와 **모의 시연 엔진 원클릭 토글러**, 그리고 **원클릭 페르소나 프리셋**과 **실전 발표 단축키**를 탑재하였습니다.

---

## 🚀 주요 변경 사항

### 1. 시연 전용 원클릭 페르소나 프리셋 탑재 (\`SourceSelectionView.tsx\`)
- 발표 및 시연 시 사용자 입력 피로도를 없애기 위해 3대 주요 페르소나 퀵 칩 추가:
  - 🏭 **생산기술 담당자** (정량 설비 스펙 및 공정 수율 중심)
  - 🛡️ **품질 담당자** (ISO 인증 및 품질 보증 체계 중심)
  - 🤝 **신규 고객 제안** (투자 유치 및 시장 경쟁력 중심)
- 칩 클릭 시 문서 목적, 타깃 청중, 톤앤매너 폼이 원클릭으로 자동 완성

### 2. 무중단 2중 React Error Boundary 및 모드 토글러 (\`ErrorBoundary.tsx\`, \`App.tsx\`, \`main.tsx\`)
- 전역(\`main.tsx\`) 및 메인 뷰(\`App.tsx\`)를 감싸는 2중 Error Boundary 컴포넌트 신규 구현
- 런타임 렌더링 에러 발생 시 앱 크래시를 차단하고 3대 복구 액션 제공 (\`다시 시도\`, \`시연 모드로 복구\`, \`캐시 초기화\`)
- 상단 글로벌 헤더에 **\`[🧪 시연 모드]\` ↔ \`[🌐 서버 모드]\`** 원클릭 토글러 배치

### 3. 발표용 키보드 단축키 및 UI Polish (\`DocumentWorkspace.tsx\`, \`StepIndicator.tsx\`)
- **실전 단축키 탑재**: \`Ctrl+S\` (로컬 저장 토스트), \`←\`/\`→\` (슬라이드 넘김), \`ESC\` (인스펙터 닫기)
- 인스펙터 미선택 시 Empty State 인터랙션 가이드 카드 노출
- 노트북 및 빔프로젝터 해상도 대비 하단 고정 독 반응형 여백 최적화(\`pb-32 sm:pb-36\`)
- 스텝 인디케이터 서브타이틀 및 모던 체크마크 디자인 적용

### 4. 발표 시연 3분 매뉴얼 치트시트 가이드 (\`docs/reference/DEMO_PRESENTATION_SCRIPT.md\`)
- 타임라인별 화면 조작 순서, 발표 멘트, 기술 소구 포인트, 심사위원 Q&A 대응 가이드 신규 작성

---

## 🧪 자체 빌드 및 검증 결과
- **TypeScript / Vite 프로덕션 빌드**: \`tsc -b && vite build\` 오류 0건 통과 (Exit Code 0)
- **로컬 시연 모드**: \`http://localhost:5173/?preview=1\` S01~S03 전 구간 무결점 동작 확인
`;

async function createPR() {
  try {
    const res = await fetch('https://api.github.com/repos/agent-ddalgi-team/agent-ddalgi-frontend/pulls', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Node-Create-PR',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        head: 'feature/source-sufficiency-workflow-integration',
        base: 'develop',
        body,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log('🎉 새 PR 생성 성공!');
      console.log(`URL: ${data.html_url}`);
      console.log(`Number: #${data.number}`);
      console.log(`Title: ${data.title}`);
    } else {
      console.error(`❌ PR 생성 실패 (HTTP ${res.status}):`, JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('네트워크 에러:', err);
  }
}

createPR();
