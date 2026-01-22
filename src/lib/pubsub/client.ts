import { PubSub } from '@google-cloud/pubsub'

const globalForPubSub = globalThis as unknown as {
  pubsub: PubSub | undefined
}

export const pubsub =
  globalForPubSub.pubsub ??
  new PubSub({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  })

if (process.env.NODE_ENV !== 'production') globalForPubSub.pubsub = pubsub
