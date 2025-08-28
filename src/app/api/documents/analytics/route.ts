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
    // Get basic document counts
    const totalDocs = await prisma.document.count({ where: { isArchived: false } })
    const publicDocs = await prisma.document.count({ 
      where: { isArchived: false, visibility: 'PUBLIC' } 
    })
    const privateDocs = await prisma.document.count({ 
      where: { isArchived: false, visibility: 'PRIVATE' } 
    })

    // Get total storage size
    const sizeResult = await prisma.document.aggregate({
      where: { isArchived: false },
      _sum: { sizeBytes: true }
    })
    const totalSize = sizeResult._sum.sizeBytes || 0

    // Get total downloads
    const totalDownloads = await prisma.documentDownloadLog.count()

    // Get documents by type
    const docsByType = await prisma.document.groupBy({
      by: ['mimeType'],
      where: { isArchived: false },
      _count: { id: true },
      _sum: { sizeBytes: true }
    })

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentUploads = await prisma.document.count({
      where: { 
        isArchived: false,
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    const recentDownloads = await prisma.documentDownloadLog.count({
      where: { 
        downloadedAt: { gte: thirtyDaysAgo }
      }
    })

    // Get top downloaded documents
    const topDocs = await prisma.document.findMany({
      where: { isArchived: false },
      include: {
        _count: { select: { downloadLogs: true } },
        owner: { select: { fullName: true } }
      },
      orderBy: { downloadLogs: { _count: 'desc' } },
      take: 10
    })

    // Get documents by folder
    const docsByFolder = await prisma.document.groupBy({
      by: ['folderId'],
      where: { isArchived: false },
      _count: { id: true }
    })

    // Get folder names for the results
    const folderIds = docsByFolder.map(d => d.folderId).filter(Boolean) as string[]
    const folders = await prisma.folder.findMany({
      where: { id: { in: folderIds } },
      select: { id: true, name: true }
    })

    const docsByFolderWithNames = docsByFolder.map(d => ({
      folderId: d.folderId,
      folderName: d.folderId ? folders.find(f => f.id === d.folderId)?.name || 'Unknown' : 'No Folder',
      count: d._count.id
    }))

    // Get monthly upload trends (last 12 months)
    const monthlyTrends = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const count = await prisma.document.count({
        where: {
          isArchived: false,
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
      })
      
      monthlyTrends.push({
        month: startOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count
      })
    }

    // Get popular tags
    const popularTags = await prisma.documentTag.groupBy({
      by: ['name'],
      _count: { name: true },
      orderBy: { _count: { name: 'desc' } },
      take: 10
    })

    return NextResponse.json({
      data: {
        overview: {
          totalDocs,
          publicDocs,
          privateDocs,
          totalSize,
          totalDownloads,
          recentUploads,
          recentDownloads
        },
        byType: docsByType.map(d => ({
          mimeType: d.mimeType,
          count: d._count.id,
          totalSize: d._sum.sizeBytes || 0
        })),
        byFolder: docsByFolderWithNames,
        topDocuments: topDocs.map(d => ({
          id: d.id,
          title: d.title,
          downloads: d._count.downloadLogs,
          owner: d.owner?.fullName || 'Unknown',
          size: d.sizeBytes
        })),
        monthlyTrends,
        popularTags: popularTags.map(t => ({
          name: t.name,
          count: t._count.name
        }))
      }
    })
  } catch (error) {
    console.error('Document analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
