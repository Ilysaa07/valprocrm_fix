import { NextRequest } from 'next/server'

function getSystemSnapshot() {
  const memory = process.memoryUsage()
  const totalMem = (global as any).TOTAL_MEM_BYTES || (1024 * 1024 * 1024 * 8) // fallback 8GB
  const freeMem = totalMem - memory.rss
  const usedMemPct = Math.min(100, Math.max(0, Math.round((memory.rss / totalMem) * 100)))

  // CPU is not directly available in Node without native modules; use loadavg as an approximation
  const load = require('os').loadavg?.()[0] || 0
  const cpuPct = Math.max(0, Math.min(100, Math.round((load / (require('os').cpus()?.length || 1)) * 100)))

  // Disk usage generally requires platform-specific tooling; expose null to avoid lying
  const diskPct: number | null = null

  return {
    cpu: cpuPct, // %
    memory: usedMemPct, // % of RSS vs assumed total
    disk: diskPct, // % or null if unknown
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode')

  if (mode === 'sse') {
    let closed = false
    let interval: ReturnType<typeof setInterval> | undefined
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        const send = () => {
          if (closed) return
          try {
            const data = getSystemSnapshot()
            controller.enqueue(encoder.encode(`event: update\n`))
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          } catch {
            // ignore enqueue after close errors
          }
        }
        send()
        interval = setInterval(send, 3000)

        const abort = () => {
          if (closed) return
          closed = true
          if (interval) clearInterval(interval)
          try { controller.close() } catch {}
        }

        // Close on client disconnect
        // @ts-ignore - NextRequest exposes signal in runtime
        const signal: AbortSignal | undefined = (req as any).signal
        if (signal) {
          if (signal.aborted) abort()
          else signal.addEventListener('abort', abort, { once: true })
        }
      },
      cancel() {
        if (!closed) {
          closed = true
          if (interval) clearInterval(interval)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    })
  }

  return Response.json(getSystemSnapshot(), { headers: { 'Cache-Control': 'no-store' } })
}


