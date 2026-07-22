const apiBaseUrl = import.meta.env.VITE_BACKEND_API_URL ?? 'http://localhost:8080'

export interface ApiEnvelope<T> {
  success: boolean
  data: T | null
  error: { code: string; message: string; details?: unknown } | null
  traceId: string
}

export interface SystemInfo {
  name: string
  version: string
  environment: string
  status: string
  database: { status: string }
  aiCore: { status: string }
  timestampUtc: string
}

export interface AnalysisResult {
  analysisId: string
  status: string
  findings: string[]
  riskLevel: string
  confidence: number
  modelVersion: string
  processedAt: string
  disclaimer: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const envelope = (await response.json()) as ApiEnvelope<T>
  if (!response.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.error?.message ?? `API error (${response.status})`)
  }
  return envelope.data
}

export const auraApi = {
  getSystemInfo: () => request<SystemInfo>('/api/v1/system/info'),
  runDemoAnalysis: () =>
    request<AnalysisResult>('/api/v1/analyses/demo', {
      method: 'POST',
      body: JSON.stringify({
        analysisId: crypto.randomUUID(),
        examinationId: crypto.randomUUID(),
        imageId: crypto.randomUUID(),
        imageType: 'Fundus',
        imageUrl: 'https://example.invalid/mock-fundus-image.jpg',
      }),
    }),
}
