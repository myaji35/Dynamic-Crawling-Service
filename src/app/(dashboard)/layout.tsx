'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useUser()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <h2
              className="cursor-pointer text-xl font-bold"
              onClick={() => router.push('/dashboard')}
            >
              DCS
            </h2>
            <nav className="flex gap-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                대시보드
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/visual-builder-demo')}
              >
                Visual Builder
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
