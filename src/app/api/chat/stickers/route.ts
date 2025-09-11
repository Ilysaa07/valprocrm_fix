import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readdir, writeFile, mkdir, stat } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const STICKERS_DIR = join(process.cwd(), 'public/uploads/stickers')

const DEFAULTS = [
  { url: '/logometa.png', name: 'logometa.png', type: 'image/png' },
  { url: '/globe.svg', name: 'globe.svg', type: 'image/svg+xml' },
  { url: '/window.svg', name: 'window.svg', type: 'image/svg+xml' },
]

export async function GET() {
  try {
    await mkdir(STICKERS_DIR, { recursive: true })
    const files = await readdir(STICKERS_DIR)
    const items = [] as Array<{ url: string; name: string; type: string }>
    for (const f of files) {
      const full = join(STICKERS_DIR, f)
      const s = await stat(full).catch(() => null)
      if (!s || !s.isFile()) continue
      const lower = f.toLowerCase()
      const type = lower.endsWith('.webp') ? 'image/webp' : lower.endsWith('.png') ? 'image/png' : lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'image/jpeg' : lower.endsWith('.svg') ? 'image/svg+xml' : ''
      if (!type) continue
      items.push({ url: `/uploads/stickers/${f}`, name: f, type })
    }
    return NextResponse.json({ stickers: [...DEFAULTS, ...items] })
  } catch (e) {
    return NextResponse.json({ stickers: DEFAULTS })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })

    const allowed = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Tipe stiker tidak didukung' }, { status: 400 })
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) return NextResponse.json({ error: 'Maksimal ukuran stiker 2MB' }, { status: 400 })

    await mkdir(STICKERS_DIR, { recursive: true })
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop() || 'webp'
    const name = `${uuidv4()}.${ext}`
    await writeFile(join(STICKERS_DIR, name), buffer)
    const url = `/uploads/stickers/${name}`

    return NextResponse.json({ sticker: { url, name, type: file.type } })
  } catch (e) {
    return NextResponse.json({ error: 'Gagal upload stiker' }, { status: 500 })
  }
}


