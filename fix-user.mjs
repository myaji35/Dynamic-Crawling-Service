import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const sessionUserId = 'cmi2g86a80000gf3dx0g4hxhc'
  const email = 'test@example.com'

  // Find user by email
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  console.log('Existing user with email:', existingUser)

  if (existingUser) {
    console.log('\n📋 Current situation:')
    console.log('- Session userId:', sessionUserId)
    console.log('- DB user id:', existingUser.id)
    console.log('- Email:', existingUser.email)
    console.log('- Name:', existingUser.name)

    if (existingUser.id !== sessionUserId) {
      console.log('\n⚠️ ID mismatch detected!')
      console.log(
        'The session is using a different user ID than what exists in the database.'
      )
      console.log('\nOptions:')
      console.log('1. Clear session and re-login')
      console.log('2. Update the session to use the correct user ID')
    } else {
      console.log('\n✅ IDs match - no action needed')
    }
  } else {
    console.log('\n❌ No user found with email:', email)
    console.log('Creating new user...')

    const newUser = await prisma.user.create({
      data: {
        id: sessionUserId,
        email: email,
        name: '테스트 사용자',
        passwordHash: 'dummy-hash',
      },
    })

    console.log('✅ User created:', newUser)
  }

  // List all users for debugging
  console.log('\n📊 All users in database:')
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  })
  console.table(allUsers)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
