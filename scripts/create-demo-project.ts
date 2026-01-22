import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clerk userId를 명령줄 인자로 받음
  const userId = process.argv[2]

  if (!userId) {
    console.log('❌ Clerk 사용자 ID를 입력하세요.')
    console.log(
      '사용법: npx tsx scripts/create-demo-project.ts <clerk-user-id>'
    )
    console.log(
      '\n브라우저 콘솔에서 localStorage.getItem("clerk:userId") 로 확인 가능합니다.'
    )
    return
  }

  console.log(`✅ 사용자 ID: ${userId}`)

  // 데모 프로젝트 생성 또는 업데이트
  const demoProject = await prisma.project.upsert({
    where: { id: 'demo-project-id' },
    update: {
      name: 'Visual Builder 데모 프로젝트',
      urls: ['https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch'],
    },
    create: {
      id: 'demo-project-id',
      userId: userId,
      name: 'Visual Builder 데모 프로젝트',
      description: '데모용 프로젝트입니다.',
      urls: ['https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch'],
      selectors: {},
      scheduleType: 'manual',
      status: 'active',
    },
  })

  console.log('✅ 데모 프로젝트 생성 완료:', demoProject)
}

main()
  .catch((e) => {
    console.error('❌ 에러:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
