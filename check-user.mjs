import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const userId = 'cmi2g86a80000gf3dx0g4hxhc'

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  console.log('User lookup result:', user)

  if (!user) {
    console.log('\n❌ User does not exist in database')
    console.log('Creating test user...')

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: 'test@example.com',
        name: '테스트 사용자',
        passwordHash: 'dummy-hash', // NextAuth doesn't require real password for OAuth
      },
    })

    console.log('✅ User created:', newUser)
  } else {
    console.log('\n✅ User exists in database')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
