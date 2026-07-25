import { ApiEnvelope, AnalysisResult, SystemInfo } from '../types/api'

const apiBaseUrl = import.meta.env.VITE_BACKEND_API_URL ?? 'http://localhost:8080'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

  const envelope = (await response.json()) as ApiEnvelope<T>

  if (!response.ok) {
    throw new Error(envelope.error?.message ?? `API error (${response.status})`)
  }

  if (!envelope.success || envelope.data === null) {
    throw new Error(envelope.error?.message ?? 'API returned no data.')
  }

  return envelope.data
}

export const auraService = {
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
