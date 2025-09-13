'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { Search, Filter, X, Users, FileText, CheckSquare, Calendar, Home, Building, Clock, MapPin } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'user' | 'document' | 'task' | 'attendance' | 'leave' | 'wfh' | 'folder'
  url: string
  metadata?: {
    status?: string
    date?: string
    author?: string
    location?: string
    priority?: string
    department?: string
    tags?: string[]
  }
  relevance: number
}

interface SearchFilter {
  type: string[]
  status: string[]
  dateRange: {
    start: string
    end: string
  }
  department: string[]
  priority: string[]
}

interface DashboardSearchProps {
  title?: string
  placeholder?: string
  searchTypes?: string[]
  showFilters?: boolean
  showRecentSearches?: boolean
  showSearchSuggestions?: boolean
  maxResults?: number
  onSearch?: (query: string, filters: SearchFilter) => void
  onResultClick?: (result: SearchResult) => void
  className?: string
}

export function DashboardSearch({ 
  title = 'Pencarian', 
  placeholder = 'Cari pengguna, dokumen, tugas...',
  searchTypes = ['user', 'document', 'task', 'attendance', 'leave', 'wfh'],
  showFilters = true,
  showRecentSearches = true,
  showSearchSuggestions = true,
  maxResults = 10,
  onSearch,
  onResultClick,
  className = '' 
}: DashboardSearchProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [filters, setFilters] = useState<SearchFilter>({
    type: [],
    status: [],
    dateRange: { start: '', end: '' },
    department: [],
    priority: []
  })
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  const searchTypeConfigs = {
    user: {
      icon: Users,
      label: 'Pengguna',
      color: 'bg-blue-100 text-blue-800'
    },
    document: {
      icon: FileText,
      label: 'Dokumen',
      color: 'bg-green-100 text-green-800'
    },
    task: {
      icon: CheckSquare,
      label: 'Tugas',
      color: 'bg-purple-100 text-purple-800'
    },
    attendance: {
      icon: Clock,
      label: 'Kehadiran',
      color: 'bg-orange-100 text-orange-800'
    },
    leave: {
      icon: Calendar,
      label: 'Izin',
      color: 'bg-indigo-100 text-indigo-800'
    },
    wfh: {
      icon: Home,
      label: 'WFH',
      color: 'bg-pink-100 text-pink-800'
    },
    folder: {
      icon: Building,
      label: 'Folder',
      color: 'bg-gray-100 text-gray-800'
    }
  }

  const statusOptions = [
    { value: 'pending', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Disetujui', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Ditolak', color: 'bg-red-100 text-red-800' },
    { value: 'completed', label: 'Selesai', color: 'bg-blue-100 text-blue-800' },
    { value: 'overdue', label: 'Terlambat', color: 'bg-red-100 text-red-800' }
  ]

  const priorityOptions = [
    { value: 'low', label: 'Rendah', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Sedang', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'Tinggi', color: 'bg-red-100 text-red-800' }
  ]

  const departmentOptions = [
    'IT',
    'HR',
    'Finance',
    'Marketing',
    'Sales',
    'Operations',
    'Customer Service'
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length > 2) {
      generateSearchSuggestions()
    } else {
      setSearchSuggestions([])
    }
  }, [query])

  const generateSearchSuggestions = () => {
    const suggestions = [
      'pengguna',
      'dokumen',
      'tugas',
      'kehadiran',
      'izin',
      'wfh',
      'laporan'
    ]
    
    const filtered = suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(query.toLowerCase())
    )
    setSearchSuggestions(filtered.slice(0, 5))
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setShowResults(true)

    // Add to recent searches
    if (!recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 9)])
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Generate mock results
      const mockResults = generateMockResults(query, filters)
      setResults(mockResults)
      
      onSearch?.(query, filters)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const generateMockResults = (searchQuery: string, searchFilters: SearchFilter): SearchResult[] => {
    const mockData: SearchResult[] = [
      {
        id: '1',
        title: 'John Doe',
        description: 'Software Engineer - IT Department',
        type: 'user',
        url: '/admin/users/1',
        metadata: {
          status: 'active',
          department: 'IT',
          tags: ['developer', 'senior']
        },
        relevance: 0.95
      },
      {
        id: '2',
        title: 'Laporan Bulanan Q4',
        description: 'Laporan kinerja perusahaan untuk kuartal ke-4',
        type: 'document',
        url: '/admin/documents/2',
        metadata: {
          status: 'published',
          date: '2024-01-15',
          author: 'Finance Team',
          tags: ['laporan', 'kuartalan', 'kinerja']
        },
        relevance: 0.88
      },
      {
        id: '3',
        title: 'Review Sistem CRM',
        description: 'Tugas review dan update sistem CRM perusahaan',
        type: 'task',
        url: '/admin/tasks/3',
        metadata: {
          status: 'in_progress',
          priority: 'high',
          department: 'IT',
          tags: ['sistem', 'crm', 'review']
        },
        relevance: 0.82
      }
    ]

    // Filter by search query
    let filtered = mockData.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Apply filters
    if (searchFilters.type.length > 0) {
      filtered = filtered.filter(item => searchFilters.type.includes(item.type))
    }

    if (searchFilters.status.length > 0) {
      filtered = filtered.filter(item => 
        item.metadata?.status && searchFilters.status.includes(item.metadata.status)
      )
    }

    if (searchFilters.department.length > 0) {
      filtered = filtered.filter(item => 
        item.metadata?.department && searchFilters.department.includes(item.metadata.department)
      )
    }

    if (searchFilters.priority.length > 0) {
      filtered = filtered.filter(item => 
        item.metadata?.priority && searchFilters.priority.includes(item.metadata.priority)
      )
    }

    return filtered.slice(0, maxResults)
  }

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result)
    setShowResults(false)
    setQuery('')
  }

  const handleFilterChange = (filterType: keyof SearchFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      type: [],
      status: [],
      dateRange: { start: '', end: '' },
      department: [],
      priority: []
    })
  }

  const getTypeIcon = (type: string) => {
    const config = searchTypeConfigs[type as keyof typeof searchTypeConfigs]
    if (!config) return FileText
    
    const Icon = config.icon
    return <Icon className="h-4 w-4" />
  }

  const getTypeLabel = (type: string) => {
    const config = searchTypeConfigs[type as keyof typeof searchTypeConfigs]
    return config?.label || type
  }

  const getTypeColor = (type: string) => {
    const config = searchTypeConfigs[type as keyof typeof searchTypeConfigs]
    return config?.color || 'bg-gray-100 text-gray-800'
  }

  const renderFiltersPanel = () => {
    if (!showFiltersPanel) return null

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipe
            </label>
            <div className="space-y-2">
              {searchTypes.map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.type.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFilterChange('type', [...filters.type, type])
                      } else {
                        handleFilterChange('type', filters.type.filter(t => t !== type))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {getTypeLabel(type)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="space-y-2">
              {statusOptions.map(status => (
                <label key={status.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFilterChange('status', [...filters.status, status.value])
                      } else {
                        handleFilterChange('status', filters.status.filter(s => s !== status.value))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {status.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Departemen
            </label>
            <div className="space-y-2">
              {departmentOptions.map(dept => (
                <label key={dept} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.department.includes(dept)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFilterChange('department', [...filters.department, dept])
                      } else {
                        handleFilterChange('department', filters.department.filter(d => d !== dept))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {dept}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prioritas
            </label>
            <div className="space-y-2">
              {priorityOptions.map(priority => (
                <label key={priority.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.priority.includes(priority.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFilterChange('priority', [...filters.priority, priority.value])
                      } else {
                        handleFilterChange('priority', filters.priority.filter(p => p !== priority.value))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {priority.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Hapus Filter
          </button>
          <button
            onClick={() => setShowFiltersPanel(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Terapkan
          </button>
        </div>
      </div>
    )
  }

  const renderSearchResults = () => {
    if (!showResults || results.length === 0) return null

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
        {isSearching ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Mencari...
          </div>
        ) : (
          <div className="p-2">
            {results.map(result => (
              <div
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(result.type)} flex-shrink-0`}>
                    {getTypeIcon(result.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {result.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {result.description}
                    </p>
                    
                    {result.metadata && (
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        {result.metadata.status && (
                          <span className={`px-2 py-1 rounded-full ${statusOptions.find(s => s.value === result.metadata?.status)?.color || 'bg-gray-100 text-gray-800'}`}>
                            {statusOptions.find(s => s.value === result.metadata?.status)?.label || result.metadata.status}
                          </span>
                        )}
                        
                        {result.metadata.department && (
                          <span className="flex items-center space-x-1">
                            <Building className="h-3 w-3" />
                            <span>{result.metadata.department}</span>
                          </span>
                        )}
                        
                        {result.metadata.priority && (
                          <span className={`px-2 py-1 rounded-full ${priorityOptions.find(p => p.value === result.metadata?.priority)?.color || 'bg-gray-100 text-gray-800'}`}>
                            {priorityOptions.find(p => p.value === result.metadata?.priority)?.label || result.metadata.priority}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderSearchSuggestions = () => {
    if (!showSearchSuggestions || searchSuggestions.length === 0) return null

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
        <div className="p-2">
          {searchSuggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => {
                setQuery(suggestion)
                setSearchSuggestions([])
                handleSearch()
              }}
              className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {suggestion}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderRecentSearches = () => {
    if (!showRecentSearches || recentSearches.length === 0) return null

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
        <div className="p-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pencarian Terbaru
          </h4>
          <div className="space-y-1">
            {recentSearches.map((search, index) => (
              <div
                key={index}
                onClick={() => {
                  setQuery(search)
                  setShowResults(false)
                  handleSearch()
                }}
                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {search}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setRecentSearches(prev => prev.filter((_, i) => i !== index))
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== ''
  )

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <Card>
        <CardBody>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              {query && (
                <button
                  onClick={() => {
                    setQuery('')
                    setResults([])
                    setShowResults(false)
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {showFilters && (
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`p-2 rounded-lg border transition-colors ${
                  hasActiveFilters 
                    ? 'bg-blue-50 border-blue-200 text-blue-600' 
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
                title="Filter"
              >
                <Filter className="h-5 w-5" />
              </button>
            )}
            
            <button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Mencari...' : 'Cari'}
            </button>
          </div>

          {renderFiltersPanel()}
          {renderSearchSuggestions()}
          {renderRecentSearches()}
          {renderSearchResults()}
        </CardBody>
      </Card>
    </div>
  )
}

// Predefined search configurations
export const adminSearchConfig = {
  title: 'Pencarian Admin',
  searchTypes: ['user', 'document', 'task', 'attendance', 'leave', 'wfh', 'folder'],
  showFilters: true,
  showRecentSearches: true,
  showSearchSuggestions: true,
  maxResults: 15
}

export const employeeSearchConfig = {
  title: 'Pencarian Karyawan',
  searchTypes: ['document', 'task', 'attendance', 'leave', 'wfh'],
  showFilters: true,
  showRecentSearches: true,
  showSearchSuggestions: true,
  maxResults: 10
}

export const documentSearchConfig = {
  title: 'Pencarian Dokumen',
  searchTypes: ['document', 'folder'],
  showFilters: true,
  showRecentSearches: false,
  showSearchSuggestions: true,
  maxResults: 20
}

export const userSearchConfig = {
  title: 'Pencarian Pengguna',
  searchTypes: ['user'],
  showFilters: true,
  showRecentSearches: false,
  showSearchSuggestions: false,
  maxResults: 25
}
