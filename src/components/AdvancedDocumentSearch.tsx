'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SearchEmptyState } from '@/components/ui/EmptyState'
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Download, 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  Presentation,
  FileCode,
  FolderOpen,
  User,
  Calendar,
  HardDrive,
  Hash,
  X,
  ArrowLeft,
  ArrowRight,
  Trash2
} from 'lucide-react'

type SearchFilters = {
  query: string
  visibility: string
  tag: string
  mimeType: string
  ownerId: string
  dateFrom: string
  dateTo: string
  sizeMin: string
  sizeMax: string
  sortBy: string
  sortOrder: string
}

type SearchResult = {
  documents: Array<{
    id: string
    title: string
    description?: string
    visibility: 'PUBLIC' | 'PRIVATE'
    sizeBytes: number
    mimeType: string
    createdAt: string
    updatedAt: string
    tags?: Array<{ id: string; name: string }>
    folder?: { id: string; name: string } | null
    owner?: { id: string; fullName: string; email: string }
    _count?: { downloadLogs: number; versions: number }
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  suggestions: string[]
}

export default function AdvancedDocumentSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    visibility: 'ALL',
    tag: '',
    mimeType: '',
    ownerId: '',
    dateFrom: '',
    dateTo: '',
    sizeMin: '',
    sizeMax: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  })
  
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; fullName: string }>>([])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const handleSearch = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'ALL') {
          params.append(key, value)
        }
      })
      params.append('page', page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/documents/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      visibility: 'ALL',
      tag: '',
      mimeType: '',
      ownerId: '',
      dateFrom: '',
      dateTo: '',
      sizeMin: '',
      sizeMax: '',
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    })
  }

  const formatBytes = (num: number) => {
    if (!num && num !== 0) return '-'
    const units = ['B', 'KB', 'MB', 'GB']
    let n = num
    let i = 0
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
    if (mimeType.includes('word')) return <FileText className="w-5 h-5 text-blue-500" />
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <Presentation className="w-5 h-5 text-orange-500" />
    if (mimeType.includes('image')) return <FileImage className="w-5 h-5 text-purple-500" />
    return <FileCode className="w-5 h-5 text-gray-500" />
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="p-6 hover:shadow-md transition-shadow card-hover fade-in">
        <div className="space-y-4">
          {/* Basic Search */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari dokumen, deskripsi, atau tag..."
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors search-input focus-ring"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={() => handleSearch()} loading={loading} className="flex items-center gap-2 btn-hover">
              <Search className="w-4 h-4" />
              Cari
            </Button>
            <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 btn-hover">
              {showAdvanced ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Sederhana
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Lanjutan
                </>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t slide-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring"
                  value={filters.visibility}
                  onChange={(e) => handleFilterChange('visibility', e.target.value)}
                >
                  <option value="ALL">Semua</option>
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>

              {/* Folder filter removed */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Filter by tag"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring"
                    value={filters.tag}
                    onChange={(e) => handleFilterChange('tag', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring"
                  value={filters.mimeType}
                  onChange={(e) => handleFilterChange('mimeType', e.target.value)}
                >
                  <option value="">Semua Tipe</option>
                  <option value="pdf">PDF</option>
                  <option value="word">Word</option>
                  <option value="excel">Excel</option>
                  <option value="powerpoint">PowerPoint</option>
                  <option value="image">Image</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring"
                  value={filters.ownerId}
                  onChange={(e) => handleFilterChange('ownerId', e.target.value)}
                >
                  <option value="">Semua User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="updatedAt">Last Updated</option>
                  <option value="createdAt">Created Date</option>
                  <option value="title">Title</option>
                  <option value="size">File Size</option>
                  <option value="downloads">Downloads</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring"
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size Min (MB)</label>
                <div className="relative">
                  <HardDrive className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring"
                    value={filters.sizeMin}
                    onChange={(e) => handleFilterChange('sizeMin', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size Max (MB)</label>
                <div className="relative">
                  <HardDrive className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors focus-ring"
                    value={filters.sizeMax}
                    onChange={(e) => handleFilterChange('sizeMax', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={() => handleSearch()} loading={loading} className="flex items-center gap-2 btn-hover">
              <Search className="w-4 h-4" />
              Cari
            </Button>
            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2 btn-hover">
              <Trash2 className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Search Results */}
      {results && (
        <Card className="p-6 hover:shadow-md transition-shadow card-hover slide-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Hasil Pencarian ({results.pagination.total} dokumen)
            </h3>
            {results.suggestions.length > 0 && (
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <span>Saran:</span>
                {results.suggestions.slice(0, 3).map((suggestion, index) => (
                  <Badge key={index} variant="outline" className="text-xs fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    {suggestion}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {results.documents.length === 0 ? (
            <SearchEmptyState 
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="space-y-3">
              {results.documents.map((doc, index) => (
                <div key={doc.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors doc-grid-item fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="file-icon">
                    {getFileIcon(doc.mimeType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">{doc.title}</h4>
                      <Badge variant={doc.visibility === 'PUBLIC' ? 'success' : 'secondary'}>
                        {doc.visibility === 'PUBLIC' ? '🌐 Public' : '🔒 Private'}
                      </Badge>
                    </div>
                    {doc.description && (
                      <p className="text-sm text-gray-600 truncate">{doc.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatBytes(doc.sizeBytes)}
                      </span>
                      <span>•</span>
                      <span>{doc._count?.downloadLogs ?? 0} downloads</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {doc.owner?.fullName || 'Unknown'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.tags.map(tag => (
                          <Badge key={tag.id} variant="outline" className="text-xs flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1 btn-hover">
                      <Eye className="w-3 h-3" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1 btn-hover">
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {results.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Halaman {results.pagination.page} dari {results.pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!results.pagination.hasPrev}
                  onClick={() => handleSearch(results.pagination.page - 1)}
                  className="flex items-center gap-1 btn-hover"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!results.pagination.hasNext}
                  onClick={() => handleSearch(results.pagination.page + 1)}
                  className="flex items-center gap-1 btn-hover"
                >
                  Next
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
