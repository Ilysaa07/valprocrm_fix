import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const visibility = searchParams.get('visibility')
    const folderId = searchParams.get('folderId')
    const tag = searchParams.get('tag')
    const mimeType = searchParams.get('mimeType')
    const ownerId = searchParams.get('ownerId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sizeMin = searchParams.get('sizeMin')
    const sizeMax = searchParams.get('sizeMax')
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const whereClauses: any = {
      isArchived: false,
    }

    // Text search
    if (query) {
      whereClauses.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { some: { name: { contains: query, mode: 'insensitive' } } } }
      ]
    }

    // Visibility filter
    if (visibility && visibility !== 'ALL') {
      whereClauses.visibility = visibility
    }

    // Folder filter
    if (folderId) {
      whereClauses.folderId = folderId
    }

    // Tag filter
    if (tag) {
      whereClauses.tags = { some: { name: { contains: tag, mode: 'insensitive' } } }
    }

    // MIME type filter
    if (mimeType) {
      whereClauses.mimeType = { contains: mimeType, mode: 'insensitive' }
    }

    // Owner filter
    if (ownerId) {
      whereClauses.ownerId = ownerId
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClauses.updatedAt = {}
      if (dateFrom) {
        whereClauses.updatedAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        whereClauses.updatedAt.lte = new Date(dateTo)
      }
    }

    // Size range filter
    if (sizeMin || sizeMax) {
      whereClauses.sizeBytes = {}
      if (sizeMin) {
        whereClauses.sizeBytes.gte = parseInt(sizeMin)
      }
      if (sizeMax) {
        whereClauses.sizeBytes.lte = parseInt(sizeMax)
      }
    }

    // Access control for non-admin users
    if (session.user.role !== 'ADMIN') {
      const accessOr: any[] = [
        { visibility: 'PUBLIC' },
        { ownerId: session.user.id },
        { acls: { some: { userId: session.user.id, canView: true } } },
        { acls: { some: { role: session.user.role, canView: true } } },
      ]
      whereClauses.OR = accessOr
    }

    // Build order by clause
    const orderBy: any = {}
    if (sortBy === 'title') {
      orderBy.title = sortOrder
    } else if (sortBy === 'size') {
      orderBy.sizeBytes = sortOrder
    } else if (sortBy === 'downloads') {
      orderBy.downloadLogs = { _count: sortOrder }
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder
    } else {
      orderBy.updatedAt = sortOrder
    }

    // Execute query
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClauses,
        include: {
          currentVer: true,
          tags: true,
          folder: true,
          owner: { select: { id: true, fullName: true, email: true } },
          _count: { select: { downloadLogs: true, versions: true } },
        },
        orderBy: orderBy,
        skip,
        take: limit,
      }),
      prisma.document.count({ where: whereClauses })
    ])

    // Get search suggestions for autocomplete
    let suggestions: string[] = []
    if (query && query.length >= 2) {
      const titleSuggestions = await prisma.document.findMany({
        where: {
          title: { contains: query, mode: 'insensitive' },
          isArchived: false
        },
        select: { title: true },
        take: 5
      })
      
      const tagSuggestions = await prisma.documentTag.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' }
        },
        select: { name: true },
        take: 5
      })

      suggestions = [
        ...titleSuggestions.map(d => d.title),
        ...tagSuggestions.map(t => t.name)
      ].slice(0, 8)
    }

    return NextResponse.json({
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        suggestions,
        filters: {
          applied: {
            query,
            visibility,
            folderId,
            tag,
            mimeType,
            ownerId,
            dateFrom,
            dateTo,
            sizeMin,
            sizeMax
          }
        }
      }
    })
  } catch (error) {
    console.error('Document search error:', error)
    return NextResponse.json({ error: 'Failed to search documents' }, { status: 500 })
  }
}
