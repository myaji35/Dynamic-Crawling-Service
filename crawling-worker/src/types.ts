/**
 * Crawling Worker Types
 */

export interface CrawlingTask {
  taskId: string
  runId: string
  projectId: string
  url: string
  selectors: Record<string, string>
}

export interface CrawlingResult {
  taskId: string
  url: string
  data: Record<string, string>
  timestamp: string
  status: 'success' | 'failed'
  errorMessage?: string
}

export interface PubSubMessage {
  data: string
  attributes?: Record<string, string>
}
