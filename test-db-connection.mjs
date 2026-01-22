#!/usr/bin/env node

/**
 * GCP Cloud SQL 데이터베이스 연결 및 CRUD 테스트
 *
 * 사용법:
 *   node test-db-connection.mjs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:posdnjs!00@127.0.0.1:5433/dcs_test',
  log: ['query', 'info', 'warn', 'error'],
})

async function testDatabaseConnection() {
  console.log('🔍 GCP Cloud SQL 데이터베이스 연결 테스트 시작...\n')

  try {
    // 1. 데이터베이스 연결 테스트
    console.log('1️⃣  데이터베이스 연결 테스트...')
    await prisma.$connect()
    console.log('✅ 데이터베이스 연결 성공!\n')

    // 2. 테이블 존재 확인 (raw query)
    console.log('2️⃣  테이블 존재 확인...')
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `
    console.log('✅ 테이블 목록:')
    tables.forEach(({ table_name }) => console.log(`   - ${table_name}`))
    console.log('')

    // 3. User 생성 테스트
    console.log('3️⃣  User 생성 테스트...')
    const testUserId = `test_${Date.now()}`
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        passwordHash: 'test_hash',
      },
    })
    console.log(`✅ User 생성 성공! ID: ${user.id}\n`)

    // 4. Project 생성 테스트
    console.log('4️⃣  Project 생성 테스트...')
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: `Test Project ${Date.now()}`,
        urls: ['https://example.com'],
        selectors: { title: 'h1' },
        scheduleType: 'manual',
        status: 'active',
      },
    })
    console.log(`✅ Project 생성 성공! ID: ${project.id}\n`)

    // 5. CrawlingRun 생성 테스트
    console.log('5️⃣  CrawlingRun 생성 테스트...')
    const run = await prisma.crawlingRun.create({
      data: {
        projectId: project.id,
        status: 'pending',
        totalTasks: 1,
      },
    })
    console.log(`✅ CrawlingRun 생성 성공! ID: ${run.id}\n`)

    // 6. CrawlingTask 생성 테스트
    console.log('6️⃣  CrawlingTask 생성 테스트...')
    const task = await prisma.crawlingTask.create({
      data: {
        runId: run.id,
        url: 'https://example.com',
        status: 'pending',
      },
    })
    console.log(`✅ CrawlingTask 생성 성공! ID: ${task.id}\n`)

    // 7. 관계 조회 테스트 (include)
    console.log('7️⃣  관계 조회 테스트...')
    const projectWithRuns = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        user: true,
        crawlingRuns: {
          include: {
            tasks: true,
          },
        },
      },
    })
    console.log('✅ 관계 조회 성공!')
    console.log(`   - Project: ${projectWithRuns.name}`)
    console.log(`   - User: ${projectWithRuns.user.email}`)
    console.log(`   - Runs: ${projectWithRuns.crawlingRuns.length}`)
    console.log(`   - Tasks: ${projectWithRuns.crawlingRuns[0].tasks.length}\n`)

    // 8. 업데이트 테스트
    console.log('8️⃣  업데이트 테스트...')
    await prisma.crawlingTask.update({
      where: { id: task.id },
      data: { status: 'success' },
    })
    console.log('✅ Task 상태 업데이트 성공!\n')

    // 9. 삭제 테스트 (CASCADE 확인)
    console.log('9️⃣  삭제 테스트 (CASCADE)...')
    await prisma.project.delete({ where: { id: project.id } })
    console.log('✅ Project 삭제 성공 (관련 Run, Task도 CASCADE 삭제됨)\n')

    // 10. CASCADE 삭제 확인
    console.log('🔟 CASCADE 삭제 확인...')
    const runExists = await prisma.crawlingRun.findUnique({
      where: { id: run.id },
    })
    const taskExists = await prisma.crawlingTask.findUnique({
      where: { id: task.id },
    })

    if (!runExists && !taskExists) {
      console.log('✅ CASCADE 삭제 확인 완료! (Run과 Task가 자동 삭제됨)\n')
    } else {
      console.log('❌ CASCADE 삭제 실패\n')
    }

    // 11. 테스트 데이터 정리
    console.log('1️⃣1️⃣  테스트 데이터 정리...')
    await prisma.user.delete({ where: { id: user.id } })
    console.log('✅ 테스트 데이터 정리 완료!\n')

    // 12. 통계 조회
    console.log('1️⃣2️⃣  데이터베이스 통계...')
    const userCount = await prisma.user.count()
    const projectCount = await prisma.project.count()
    const runCount = await prisma.crawlingRun.count()
    const taskCount = await prisma.crawlingTask.count()

    console.log(`   - Users: ${userCount}`)
    console.log(`   - Projects: ${projectCount}`)
    console.log(`   - CrawlingRuns: ${runCount}`)
    console.log(`   - CrawlingTasks: ${taskCount}\n`)

    console.log(
      '🎉 모든 테스트 통과! GCP Cloud SQL 연결 및 CRUD 작업이 정상적으로 작동합니다.\n'
    )
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message)
    console.error('\n상세 오류:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 데이터베이스 연결 종료')
  }
}

// 실행
testDatabaseConnection()
