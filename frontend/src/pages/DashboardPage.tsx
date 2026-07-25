import { useEffect, useState } from 'react'
import { auraService } from '../services/auraService'
import { StatusBadge } from '../components/StatusBadge'
import type { AnalysisResult, SystemInfo } from '../types/api'

export function DashboardPage() {
  const [system, setSystem] = useState<SystemInfo | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    auraService.getSystemInfo().then(setSystem).catch((error: Error) => setStatusError(error.message))
  }, [])

  async function runAnalysis() {
    setLoading(true)
    setAnalysis(null)
    setAnalysisError(null)
    try {
      setAnalysis(await auraService.runDemoAnalysis())
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Không thể phân tích thử.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <header className="hero">
        <div className="brand">AURA <span>Milestone 1</span></div>
        <p className="kicker">RETINAL VASCULAR HEALTH</p>
        <h1>Nền tảng sàng lọc<br />rõ ràng và có trách nhiệm.</h1>
        <p className="intro">Bộ khung kỹ thuật kết nối giao diện, API, PostgreSQL và dịch vụ phân tích mô phỏng.</p>
      </header>

      <section className="panel" aria-labelledby="system-heading">
        <div className="section-heading">
          <div><p className="kicker">SYSTEM PULSE</p><h2 id="system-heading">Trạng thái hệ thống</h2></div>
          <span className="timestamp">{system ? new Date(system.timestampUtc).toLocaleString('vi-VN') : 'Đang kiểm tra…'}</span>
        </div>
        {statusError ? <p className="error">Không kết nối được Backend API: {statusError}</p> : (
          <div className="status-grid">
            <StatusBadge label="Backend API" status={system ? 'healthy' : 'loading'} />
            <StatusBadge label="PostgreSQL" status={system?.database.status ?? 'loading'} />
            <StatusBadge label="AI Core qua Backend" status={system?.aiCore.status ?? 'loading'} />
          </div>
        )}
      </section>

      <section className="panel analysis-panel" aria-labelledby="analysis-heading">
        <div>
          <p className="kicker">SAFE DEMONSTRATION</p>
          <h2 id="analysis-heading">Phân tích thử</h2>
          <p>Gửi tham chiếu ảnh giả lập qua Backend tới AI Core. Không tải hoặc xử lý ảnh y tế thật.</p>
          <button onClick={runAnalysis} disabled={loading}>{loading ? 'Đang phân tích…' : 'Phân tích thử'}</button>
        </div>
        <div className="result" aria-live="polite">
          {!analysis && !analysisError && <p className="muted">Kết quả mô phỏng sẽ xuất hiện tại đây.</p>}
          {analysisError && <p className="error">{analysisError}</p>}
          {analysis && <>
            <span className="result-label">KẾT QUẢ MOCK</span>
            <h3>Nguy cơ: {analysis.riskLevel}</h3>
            <p>{analysis.findings.join(' ')}</p>
            <dl><dt>Độ tin cậy</dt><dd>{Math.round(analysis.confidence * 100)}%</dd><dt>Phiên bản</dt><dd>{analysis.modelVersion}</dd></dl>
            <p className="disclaimer">{analysis.disclaimer}</p>
          </>}
        </div>
      </section>
      <footer>AI chỉ hỗ trợ sàng lọc, không thay thế chẩn đoán của bác sĩ.</footer>
    </main>
  )
}
