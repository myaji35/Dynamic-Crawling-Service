import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function checkAuthorization(projectId: string) {
  const { userId } = await auth()

  if (!userId) {
    return {
      userId: null,
      project: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project || project.userId !== userId) {
    return {
      userId,
      project: null,
      error: NextResponse.json({ error: 'Project not found' }, { status: 404 }),
    }
  }

  return { userId, project, error: null }
}

export async function getCurrentUserId() {
  const { userId } = await auth()
  return userId
}
