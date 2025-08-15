import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: conversationId } = await params

    const form = await req.formData()
    const file = form.get('file') as unknown as File
    if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })

    console.log('Voice note file received:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    const type = file.type || ''
    const isAllowed = (
      type.startsWith('audio/webm') ||
      type.startsWith('audio/ogg') ||
      type.startsWith('audio/mpeg') ||
      type.startsWith('audio/mp4') ||
      type.startsWith('audio/wav')
    )
    if (!isAllowed) return NextResponse.json({ error: `Format voice note tidak didukung (${type})` }, { status: 400 })
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) return NextResponse.json({ error: 'Maksimal 10MB' }, { status: 400 })

    // Save file
    const dir = join(process.cwd(), 'public/uploads/voice')
    await mkdir(dir, { recursive: true })
    const ext = type.includes('webm') ? 'webm' : type.includes('ogg') ? 'ogg' : type.includes('wav') ? 'wav' : type.includes('mp4') ? 'm4a' : 'mp3'
    const fileName = `${uuidv4()}.${ext}`
    const bytes = Buffer.from(await file.arrayBuffer())
    await writeFile(join(dir, fileName), bytes)
    
    // Use the correct public URL that matches the file structure
    const url = `/uploads/voice/${fileName}`
    
    console.log('Voice note file saved:', { 
      fileName, 
      url, 
      size: file.size,
      fullPath: join(dir, fileName),
      publicUrl: url
    })

    // Create message with attachment as AUDIO
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content: 'Voice note',
        messageType: 'AUDIO',
        attachments: { create: [{ fileName, fileUrl: url, fileSize: file.size, fileType: file.type }] },
      },
      include: { 
        sender: { select: { id: true, fullName: true, profilePicture: true } }, 
        attachments: true 
      },
    })

    console.log('Message created:', {
      id: message.id,
      messageType: message.messageType,
      attachments: message.attachments
    })

    // Notify via socket
    try {
      const io = (global as any).io
      if (io) {
        const socketMessage = {
          ...message,
          readByUserIds: [],
        }
        console.log('Emitting socket message:', JSON.stringify(socketMessage, null, 2))
        console.log('Message attachments:', socketMessage.attachments)
        console.log('Message type:', socketMessage.messageType)
        io.to(`conversation:${conversationId}`).emit('new_message', socketMessage)
      } else {
        console.warn('Socket.IO not available')
      }
    } catch (socketError) {
      console.error('Socket error:', socketError)
    }

    return NextResponse.json({ message })
  } catch (e) {
    console.error('Voice note error:', e)
    return NextResponse.json({ error: 'Gagal mengirim voice note' }, { status: 500 })
  }
}


