'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
})

export function GraphVisualization() {
  const [data, setData] = useState({ nodes: [], links: [] })
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  useEffect(() => {
    // Fetch graph data
    fetch('http://localhost:8000/api/v1/graph/visualize')
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error('Failed to fetch graph data:', err))

    // Update dimensions based on container
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      })
    }
  }, [])

  return (
    <Card className="w-[800px] h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Knowledge Graph</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0" ref={containerRef}>
        {data.nodes.length > 0 ? (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={data}
            nodeLabel="label"
            nodeAutoColorBy="label"
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No graph data available. Connect Google Drive to start.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
