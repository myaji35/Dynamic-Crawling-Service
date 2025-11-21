import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { ConnectGoogle } from '@/components/connect-google'
import { ChatInterface } from '@/components/chat-interface'
import { GraphVisualization } from '@/components/graph-visualization'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <h1 className="text-4xl font-bold">GraphMind SaaS</h1>
      <p className="text-xl text-muted-foreground">
        Your Personal Knowledge Graph RAG
      </p>

      <div className="flex gap-4 mt-8">
        <SignedOut>
          <SignInButton mode="modal">
            <Button size="lg">Sign In</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Welcome back!</span>
              <UserButton />
            </div>
            <ConnectGoogle />
            <div className="flex gap-8">
              <ChatInterface />
              <GraphVisualization />
            </div>
          </div>
        </SignedIn>
      </div>
    </div>
  )
}
