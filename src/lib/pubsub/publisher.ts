import { pubsub } from './client'

export interface CrawlingTaskMessage {
  projectId: string
  runId: string
  taskId: string
  url: string
  selectors: Record<string, string>
}

/**
 * Publish crawling task messages to Pub/Sub
 */
export async function publishCrawlingTasks(
  tasks: CrawlingTaskMessage[]
): Promise<string[]> {
  const topicName = process.env.PUBSUB_TOPIC || 'crawling-tasks'
  const topic = pubsub.topic(topicName)

  const messageIds: string[] = []

  for (const task of tasks) {
    const dataBuffer = Buffer.from(JSON.stringify(task))
    const messageId = await topic.publish(dataBuffer)
    messageIds.push(messageId)
  }

  return messageIds
}

/**
 * Publish a single crawling task message
 */
export async function publishCrawlingTask(
  task: CrawlingTaskMessage
): Promise<string> {
  const messageIds = await publishCrawlingTasks([task])
  return messageIds[0]
}
