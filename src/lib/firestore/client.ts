import { Firestore } from '@google-cloud/firestore'

const globalForFirestore = globalThis as unknown as {
  firestore: Firestore | undefined
}

export const firestore =
  globalForFirestore.firestore ??
  new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  })

if (process.env.NODE_ENV !== 'production')
  globalForFirestore.firestore = firestore
