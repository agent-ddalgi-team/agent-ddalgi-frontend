import { useState } from 'react'
import { FileUploadPanel } from './components/profile/FileUploadPanel'
import { GeneratePanel } from './components/profile/GeneratePanel'
import { MockLoaderPanel } from './components/profile/MockLoaderPanel'
import { ResultPanel } from './components/profile/ResultPanel'
import { StatusPanel } from './components/profile/StatusPanel'
import { useProfileJob } from './hooks/useProfileJob'

function App() {
  const [files, setFiles] = useState<File[]>([])
  const [companyHint, setCompanyHint] = useState('')
  const {
    status,
    error,
    profile,
    jobId,
    generating,
    docStatus,
    docBusy,
    generate,
    loadMockResponse,
    downloadDocument,
  } = useProfileJob()

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6 text-gray-900">
      <h1 className="mb-1 text-xl font-semibold">회사소개서 초안 도우미</h1>
      <p className="mb-5 text-[13px] text-gray-500">
        내부 검토용 · 담당자 확인 전 대외 사용 금지
      </p>

      <FileUploadPanel files={files} onFilesChange={setFiles} />

      <GeneratePanel
        companyHint={companyHint}
        onCompanyHintChange={setCompanyHint}
        onGenerate={() => generate(files, companyHint.trim())}
        generating={generating}
      />

      <MockLoaderPanel
        onLoad={loadMockResponse}
        onParseError={(message) =>
          loadMockResponse({
            job_id: '',
            status: 'error',
            result: null,
            error: { code: 'NOT_JSON', message },
          })
        }
      />

      <StatusPanel status={status} jobId={jobId} error={error} />

      {profile && (
        <ResultPanel
          profile={profile}
          docBusy={docBusy}
          docStatus={docStatus}
          onDownload={downloadDocument}
        />
      )}
    </div>
  )
}

export default App
