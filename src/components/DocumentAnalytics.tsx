'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  FileText, 
  HardDrive, 
  Download, 
  TrendingUp, 
  FileImage, 
  FileSpreadsheet, 
  Presentation,
  FileCode,
  FolderOpen,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Hash,
  Calendar,
  User
} from 'lucide-react'

type AnalyticsData = {
  overview: {
    totalDocs: number
    publicDocs: number
    privateDocs: number
    totalSize: number
    totalDownloads: number
    recentUploads: number
    recentDownloads: number
  }
  byType: Array<{
    mimeType: string
    count: number
    totalSize: number
  }>
  byFolder: Array<{
    folderId: string | null
    folderName: string
    count: number
  }>
  topDocuments: Array<{
    id: string
    title: string
    downloads: number
    owner: string
    size: number
  }>
  monthlyTrends: Array<{
    month: string
    count: number
  }>
  popularTags: Array<{
    name: string
    count: number
  }>
}

export default function DocumentAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/documents/analytics')
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }
      const data = await response.json()
      setAnalytics(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (num: number) => {
    if (!num && num !== 0) return '-'
    const units = ['B', 'KB', 'MB', 'GB']
    let n = num
    let i = 0
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
  }

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
    if (mimeType.includes('word')) return <FileText className="w-5 h-5 text-blue-500" />
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <Presentation className="w-5 h-5 text-orange-500" />
    if (mimeType.includes('image')) return <FileImage className="w-5 h-5 text-purple-500" />
    return <FileCode className="w-5 h-5 text-gray-500" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadAnalytics} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </Button>
        </div>
      </Card>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 stats-card hover:shadow-md transition-shadow fade-in">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 file-icon" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Dokumen</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalDocs}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 stats-card hover:shadow-md transition-shadow fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <HardDrive className="w-6 h-6 text-green-600 file-icon" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Storage</p>
              <p className="text-2xl font-bold text-gray-900">{formatBytes(analytics.overview.totalSize)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 stats-card hover:shadow-md transition-shadow fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Download className="w-6 h-6 text-purple-600 file-icon" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalDownloads}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 stats-card hover:shadow-md transition-shadow fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600 file-icon" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">30 Hari Terakhir</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.recentUploads}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents by Type */}
        <Card className="p-6 hover:shadow-md transition-shadow card-hover slide-in">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Dokumen berdasarkan Tipe
          </h3>
          <div className="space-y-3">
            {analytics.byType.map((type, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="file-icon">
                    {getFileTypeIcon(type.mimeType)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {type.mimeType.split('/')[1]?.toUpperCase() || type.mimeType}
                    </p>
                    <p className="text-sm text-gray-600">{type.count} dokumen</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatBytes(type.totalSize)}</p>
                  <p className="text-sm text-gray-600">
                    {((type.totalSize / analytics.overview.totalSize) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Documents by Folder */}
        <Card className="p-6 hover:shadow-md transition-shadow card-hover slide-in" style={{ animationDelay: '200ms' }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-green-600" />
            Dokumen berdasarkan Folder
          </h3>
          <div className="space-y-3">
            {analytics.byFolder.map((folder, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-green-500 file-icon" />
                  <div>
                    <p className="font-medium text-gray-900">{folder.folderName}</p>
                    <p className="text-sm text-gray-600">{folder.count} dokumen</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {((folder.count / analytics.overview.totalDocs) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Documents */}
      <Card className="p-6 hover:shadow-md transition-shadow card-hover slide-in" style={{ animationDelay: '400ms' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          Dokumen Terpopuler
        </h3>
        <div className="space-y-3">
          {analytics.topDocuments.map((doc, index) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900 line-clamp-1">{doc.title}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    oleh {doc.owner}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{doc.downloads} downloads</p>
                <p className="text-sm text-gray-600">{formatBytes(doc.size)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Popular Tags */}
      <Card className="p-6 hover:shadow-md transition-shadow card-hover slide-in" style={{ animationDelay: '500ms' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5 text-purple-600" />
          Tag Terpopuler
        </h3>
        <div className="flex flex-wrap gap-2">
          {analytics.popularTags.map((tag, index) => (
            <div
              key={tag.name}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors cursor-pointer fade-in btn-hover"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-sm font-medium">#{tag.name}</span>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                {tag.count}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Monthly Trends */}
      <Card className="p-6 hover:shadow-md transition-shadow card-hover slide-in" style={{ animationDelay: '600ms' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Trend Upload Bulanan
        </h3>
        <div className="flex items-end justify-between h-32">
          {analytics.monthlyTrends.map((trend, index) => {
            const maxCount = Math.max(...analytics.monthlyTrends.map(t => t.count))
            const height = maxCount > 0 ? (trend.count / maxCount) * 100 : 0
            
            return (
              <div key={index} className="flex flex-col items-center fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div 
                  className="w-8 bg-indigo-500 rounded-t transition-all duration-300 hover:bg-indigo-600 cursor-pointer hover:scale-110"
                  style={{ height: `${height}%` }}
                  title={`${trend.month}: ${trend.count} dokumen`}
                ></div>
                <p className="text-xs text-gray-600 mt-2 text-center w-12">
                  {trend.month}
                </p>
                <p className="text-xs font-medium text-gray-900">{trend.count}</p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
