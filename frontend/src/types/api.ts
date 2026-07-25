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
