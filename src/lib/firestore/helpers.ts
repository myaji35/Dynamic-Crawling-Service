import { firestore } from './client'

export interface CrawledData {
  [key: string]: string | number | boolean | null | CrawledDataMetadata
  _metadata: CrawledDataMetadata
}

export interface CrawledDataMetadata {
  projectId: string
  runId: string
  taskId: string
  url: string
  crawledAt: string
  crawlDuration: number
}

/**
 * Get project data from Firestore
 * Path: projects/{projectId}/runs/{timestamp}/data
 */
export async function getProjectData(
  projectId: string,
  options?: {
    limit?: number
    runId?: string
    offset?: number
  }
): Promise<CrawledData[]> {
  const limit = options?.limit ?? 100
  const offset = options?.offset ?? 0

  let query = firestore
    .collection('projects')
    .doc(projectId)
    .collection('runs')
    .orderBy('__name__', 'desc')

  // If specific runId requested, filter by that run
  if (options?.runId) {
    query = query.where('__name__', '==', options.runId)
  }

  const runsSnapshot = await query.limit(1).get()

  if (runsSnapshot.empty) {
    return []
  }

  // Get data from the latest run
  const latestRunDoc = runsSnapshot.docs[0]
  const dataQuery = latestRunDoc.ref
    .collection('data')
    .orderBy('_metadata.crawledAt', 'desc')
    .offset(offset)
    .limit(limit)

  const dataSnapshot = await dataQuery.get()

  return dataSnapshot.docs.map((doc) => doc.data() as CrawledData)
}

/**
 * Save crawled data to Firestore
 * Path: projects/{projectId}/runs/{timestamp}/data/{docId}
 */
export async function saveProjectData(
  projectId: string,
  runId: string,
  data: CrawledData
): Promise<string> {
  const timestamp = new Date().getTime()

  const docRef = await firestore
    .collection('projects')
    .doc(projectId)
    .collection('runs')
    .doc(timestamp.toString())
    .collection('data')
    .add(data)

  return docRef.id
}

/**
 * Delete all data for a project
 */
export async function deleteProjectData(projectId: string): Promise<void> {
  const projectRef = firestore.collection('projects').doc(projectId)

  // Delete all runs and their data
  const runsSnapshot = await projectRef.collection('runs').get()

  const batch = firestore.batch()
  let count = 0

  for (const runDoc of runsSnapshot.docs) {
    const dataSnapshot = await runDoc.ref.collection('data').get()

    for (const dataDoc of dataSnapshot.docs) {
      batch.delete(dataDoc.ref)
      count++

      // Firestore batch limit is 500
      if (count >= 500) {
        await batch.commit()
        count = 0
      }
    }

    batch.delete(runDoc.ref)
    count++
  }

  if (count > 0) {
    await batch.commit()
  }
}
