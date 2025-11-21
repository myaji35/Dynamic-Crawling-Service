'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useState } from 'react'

export function ConnectGoogle() {
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      // Fetch the auth URL from our backend
      // Note: In a real app, include the Authorization header with the Clerk token
      const response = await fetch(
        'http://localhost:8000/api/v1/auth/google/authorize',
        {
          headers: {
            Authorization: 'Bearer mock_token', // Replace with real token
          },
        }
      )
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to connect:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Data Sources</CardTitle>
        <CardDescription>
          Connect your Google Workspace to start indexing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleConnect} disabled={isLoading} className="w-full">
          {isLoading ? 'Connecting...' : 'Connect Google Drive & Gmail'}
        </Button>
      </CardContent>
    </Card>
  )
}
