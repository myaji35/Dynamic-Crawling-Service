import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

/**
 * 테스트 데이터베이스 초기화 (전체 삭제)
 */
export async function clearDatabase(): Promise<void> {
  // Tasks는 Run과의 관계로 자동 삭제됨 (CASCADE)
  await prisma.crawlingRun.deleteMany()
  await prisma.project.deleteMany()
  // User와 Session은 테스트 간 유지 (Clerk ID와 연동)
}

/**
 * 테스트 사용자 확보 (Clerk userId로 User 레코드 생성/확인)
 * 실제 API와 동일한 방식으로 User upsert
 */
export async function ensureTestUser(
  clerkUserId: string,
  email?: string
): Promise<void> {
  await prisma.user.upsert({
    where: { id: clerkUserId },
    update: {},
    create: {
      id: clerkUserId,
      email: email || 'test@example.com',
      name: 'Test User',
      passwordHash: '', // Clerk 사용 시 불필요
    },
  })
}

/**
 * 테스트 프로젝트 생성
 * @param userId - Clerk userId (예: "user_2xxx...")
 * @param data - 프로젝트 데이터 (선택사항)
 */
export async function createTestProject(
  userId: string,
  data?: Partial<{
    name: string
    urls: string[]
    selectors: Record<string, string>
    scheduleType: string
  }>
) {
  const timestamp = Date.now()

  // User 레코드 확보 (Clerk ID로)
  await ensureTestUser(userId)

  return await prisma.project.create({
    data: {
      userId,
      name: data?.name || `Test Project ${timestamp}`,
      urls: data?.urls || ['https://books.toscrape.com/'],
      selectors: data?.selectors || { title: 'h3 a', price: '.price_color' },
      scheduleType: (data?.scheduleType as any) || 'manual',
      status: 'active',
    },
  })
}

/**
 * 테스트 프로젝트 삭제
 */
export async function deleteTestProject(projectId: string): Promise<void> {
  // 관련 크롤링 데이터 먼저 삭제
  // CrawlingTask는 run을 통해 projectId에 접근
  await prisma.crawlingTask.deleteMany({
    where: {
      run: {
        projectId,
      },
    },
  })
  await prisma.crawlingRun.deleteMany({ where: { projectId } })
  await prisma.project.delete({ where: { id: projectId } })
}

/**
 * 특정 사용자의 모든 프로젝트 삭제
 */
export async function clearUserProjects(userId: string): Promise<void> {
  const projects = await prisma.project.findMany({ where: { userId } })

  for (const project of projects) {
    await deleteTestProject(project.id)
  }
}

/**
 * 프로젝트 이름으로 조회
 */
export async function getProjectByName(name: string) {
  return await prisma.project.findFirst({ where: { name } })
}

/**
 * 프로젝트 통계 조회
 */
export async function getProjectStats(userId: string) {
  const totalProjects = await prisma.project.count({ where: { userId } })
  const activeProjects = await prisma.project.count({
    where: { userId, status: 'active' },
  })

  return { totalProjects, activeProjects }
}

/**
 * Prisma 클라이언트 연결 해제
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

export { prisma }
