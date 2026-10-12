import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Sparkles, Trash2 } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  sectionName?: string
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    // 콘솔에 디버깅 정보 기록
    console.error('[ErrorBoundary caught error]', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleSafeDemoMode = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('preview', '1')
    window.location.href = url.toString()
  }

  handleClearAndReload = () => {
    sessionStorage.clear()
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const sectionTitle = this.props.sectionName || '화면'

      return (
        <div className="mx-auto my-8 w-full max-w-2xl px-4 animate-fade-in">
          <div className="overflow-hidden rounded-2xl border border-rose-200/90 bg-white/95 p-6 shadow-xl shadow-rose-950/5 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/25">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    {sectionTitle} 일시적인 렌더링 오류가 발생했습니다
                  </h2>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                    안전 보호됨
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  예상치 못한 데이터 불일치로 인해 화면 표시가 중단되었으나, 에러 바운더리가 활성화되어 애플리케이션 전체 충돌을 방지했습니다. 아래 복구 옵션을 통해 즉시 작업을 재개하실 수 있습니다.
                </p>

                {this.state.error && (
                  <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50/70 p-3 text-xs font-mono text-rose-900">
                    <p className="font-bold font-sans text-rose-950 mb-1">오류 메시지:</p>
                    <p className="break-all">{this.state.error.message || String(this.state.error)}</p>
                  </div>
                )}

                {/* 빠른 복구 버튼 액션 */}
                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={this.handleReset}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:shadow-xs active:scale-[0.99]"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
                    이 화면 다시 시도
                  </button>

                  <button
                    type="button"
                    onClick={this.handleSafeDemoMode}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#007A78] to-[#0F766E] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:brightness-105 active:scale-[0.99]"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-teal-200" />
                    시연 모드로 안전 복구
                  </button>

                  <button
                    type="button"
                    onClick={this.handleClearAndReload}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-800"
                    title="세션 스토리지를 비우고 새로고침합니다"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                    캐시 초기화
                  </button>
                </div>

                {/* 기술 세부 정보 (접이식) */}
                {this.state.errorInfo && (
                  <details className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                    <summary className="cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                      개발자 진단 스택 추적 보기
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-all rounded-lg bg-slate-900 p-3 text-[10px] text-slate-200">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
