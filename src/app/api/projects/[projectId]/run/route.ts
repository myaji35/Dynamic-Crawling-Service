/**
 * Crawling Run API
 * POST /api/projects/:projectId/run - 크롤링 작업 실행
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { CrawlerEngine } from '@/lib/crawler/engine'

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { projectId } = params

    // 프로젝트 조회 및 권한 확인
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // CrawlingRun 생성
    const urls = project.urls as string[]
    const selectors = project.selectors as Record<string, string>

    const run = await prisma.crawlingRun.create({
      data: {
        projectId: project.id,
        status: 'running',
        totalTasks: urls.length,
        successTasks: 0,
        failedTasks: 0,
      },
    })

    // 크롤링 작업들 생성
    const tasks = await prisma.crawlingTask.createMany({
      data: urls.map((url) => ({
        runId: run.id,
        url,
        status: 'pending',
      })),
    })

    // 비동기로 크롤링 실행 (백그라운드)
    executeCrawling(run.id, urls, selectors).catch((error) => {
      console.error('Crawling execution error:', error)
    })

    // 즉시 응답 반환
    return NextResponse.json({
      success: true,
      data: {
        runId: run.id,
        status: 'running',
        totalTasks: urls.length,
      },
    })
  } catch (error) {
    console.error('Error starting crawl:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start crawling',
      },
      { status: 500 }
    )
  }
}

/**
 * 크롤링 실행 (비동기)
 */
async function executeCrawling(
  runId: string,
  urls: string[],
  selectors: Record<string, string>
) {
  const crawler = new CrawlerEngine({ headless: true })

  try {
    for (const url of urls) {
      // Task 조회
      const task = await prisma.crawlingTask.findFirst({
        where: {
          runId,
          url,
        },
      })

      if (!task) continue

      // Task 상태 업데이트: 실행 중
      await prisma.crawlingTask.update({
        where: { id: task.id },
        data: {
          status: 'pending',
          startedAt: new Date(),
        },
      })

      try {
        // 크롤링 실행
        const result = await crawler.crawl({
          url,
          fields: selectors,
        })

        if (result.error) {
          // 실패
          await prisma.crawlingTask.update({
            where: { id: task.id },
            data: {
              status: 'failed',
              completedAt: new Date(),
              errorMessage: result.error,
            },
          })

          // Run의 실패 카운트 증가
          await prisma.crawlingRun.update({
            where: { id: runId },
            data: {
              failedTasks: { increment: 1 },
            },
          })
        } else {
          // 성공 - 데이터를 Firestore나 JSON으로 저장
          // 여기서는 간단히 Firestore Doc ID만 저장 (실제 데이터는 별도 저장 필요)
          const firestoreDocId = `crawl_${task.id}_${Date.now()}`

          // TODO: 실제로 Firestore에 저장하는 로직 추가
          // await saveToFirestore(firestoreDocId, result.data);

          await prisma.crawlingTask.update({
            where: { id: task.id },
            data: {
              status: 'success',
              completedAt: new Date(),
              firestoreDocId,
            },
          })

          // Run의 성공 카운트 증가
          await prisma.crawlingRun.update({
            where: { id: runId },
            data: {
              successTasks: { increment: 1 },
            },
          })
        }
      } catch (taskError) {
        // Task 실행 중 에러
        await prisma.crawlingTask.update({
          where: { id: task.id },
          data: {
            status: 'failed',
            completedAt: new Date(),
            errorMessage:
              taskError instanceof Error ? taskError.message : 'Unknown error',
          },
        })

        await prisma.crawlingRun.update({
          where: { id: runId },
          data: {
            failedTasks: { increment: 1 },
          },
        })
      }
    }

    // 모든 작업 완료
    await prisma.crawlingRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    })

    // 프로젝트의 lastRunAt 업데이트
    const run = await prisma.crawlingRun.findUnique({
      where: { id: runId },
    })

    if (run) {
      await prisma.project.update({
        where: { id: run.projectId },
        data: {
          lastRunAt: new Date(),
        },
      })
    }
  } catch (error) {
    // Run 실패
    await prisma.crawlingRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })
  } finally {
    await crawler.close()
  }
}
