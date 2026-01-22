/**
 * Firestore Client for Crawling Worker
 */

import { Firestore } from '@google-cloud/firestore'
import { CrawlingResult } from './types.js'

// Initialize Firestore
export const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
})

/**
 * Save crawling result to Firestore
 */
export async function saveCrawlingResult(
  projectId: string,
  runId: string,
  result: CrawlingResult
): Promise<string> {
  const collectionName = `projects/${projectId}/runs/${runId}/data`
  const docRef = await firestore.collection(collectionName).add({
    ...result,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved to Firestore: ${docRef.id}`)
  return docRef.id
}

/**
 * Update task status in Firestore
 */
export async function updateTaskStatus(
  taskId: string,
  status: 'success' | 'failed',
  errorMessage?: string
): Promise<void> {
  // This would update the task status in your primary database
  // For now, we'll just log it
  console.log(`📊 Task ${taskId} status: ${status}`, errorMessage || '')
}
