/**
 * Crawling Worker - Cloud Run Entry Point
 * Receives Pub/Sub messages and processes crawling tasks
 */

import express from 'express'
import { PrismaClient } from '@prisma/client'
import { crawlPage } from './crawler.js'
import { saveCrawlingResult, updateTaskStatus } from './firestore.js'
import { CrawlingTask, PubSubMessage } from './types.js'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 8080

// Middleware
app.use(express.json())

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'crawling-worker',
    timestamp: new Date().toISOString(),
  })
})

/**
 * Pub/Sub push endpoint
 * Cloud Pub/Sub will POST messages to this endpoint
 */
app.post('/pubsub/crawl', async (req, res) => {
  console.log('📬 Received Pub/Sub message')

  try {
    // Parse Pub/Sub message
    const message: PubSubMessage = req.body.message
    if (!message || !message.data) {
      console.error('❌ Invalid message format')
      res.status(400).send('Bad Request: Invalid message format')
      return
    }

    // Decode base64 data
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8')
    const task: CrawlingTask = JSON.parse(decodedData)

    console.log(
      `📋 Processing task ${task.taskId} for project ${task.projectId}`
    )

    // Update task status to 'running'
    await prisma.crawlingTask.update({
      where: { id: task.taskId },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    })

    // Perform crawling
    const result = await crawlPage(task)

    // Save result to Firestore
    const firestoreDocId = await saveCrawlingResult(
      task.projectId,
      task.runId,
      result
    )

    // Update task status based on result
    if (result.status === 'success') {
      await prisma.crawlingTask.update({
        where: { id: task.taskId },
        data: {
          status: 'success',
          completedAt: new Date(),
          firestoreDocId,
        },
      })

      // Update run statistics
      await prisma.crawlingRun.update({
        where: { id: task.runId },
        data: {
          successTasks: { increment: 1 },
        },
      })

      console.log(`✅ Task ${task.taskId} completed successfully`)
    } else {
      await prisma.crawlingTask.update({
        where: { id: task.taskId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: result.errorMessage,
        },
      })

      // Update run statistics
      await prisma.crawlingRun.update({
        where: { id: task.runId },
        data: {
          failedTasks: { increment: 1 },
        },
      })

      console.error(`❌ Task ${task.taskId} failed: ${result.errorMessage}`)
    }

    // Check if run is complete
    const run = await prisma.crawlingRun.findUnique({
      where: { id: task.runId },
      include: { _count: { select: { tasks: true } } },
    })

    if (run) {
      const totalCompleted = run.successTasks + run.failedTasks
      if (totalCompleted === run.totalTasks) {
        await prisma.crawlingRun.update({
          where: { id: task.runId },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        })
        console.log(
          `🏁 Run ${task.runId} completed: ${run.successTasks}/${run.totalTasks} successful`
        )
      }
    }

    // Acknowledge message
    res.status(200).send('OK')
  } catch (error) {
    console.error('❌ Error processing message:', error)
    // Return 200 to acknowledge message even on error (prevents infinite retries)
    // You might want to implement a dead letter queue for failed messages
    res.status(200).send('Error processed')
  }
})

/**
 * Manual crawl endpoint (for testing)
 */
app.post('/crawl', async (req, res) => {
  console.log('🔧 Manual crawl request')

  try {
    const task: CrawlingTask = req.body

    if (!task.taskId || !task.url || !task.selectors) {
      res.status(400).json({ error: 'Invalid task format' })
      return
    }

    const result = await crawlPage(task)
    res.json(result)
  } catch (error) {
    console.error('❌ Manual crawl error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`🚀 Crawling Worker listening on port ${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(
    `   GCP Project: ${process.env.GOOGLE_CLOUD_PROJECT || 'not set'}`
  )
})

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('📴 SIGTERM received, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})
