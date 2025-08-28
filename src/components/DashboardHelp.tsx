'use client'

import { Card, CardBody } from '@/components/ui/Card'
import { HelpCircle, BookOpen, Video, MessageCircle, ExternalLink, ChevronRight, ChevronDown, Search, Filter, Star, Clock, Users, FileText, CheckSquare, Calendar, Home, Building, Settings, Shield, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

interface HelpArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  lastUpdated: string
  views: number
  helpful: number
  videoUrl?: string
  externalLinks?: string[]
}

interface HelpCategory {
  id: string
  name: string
  description: string
  icon: any
  color: string
  articleCount: number
}

interface DashboardHelpProps {
  title?: string
  showCategories?: boolean
  showSearch?: boolean
  showFavorites?: boolean
  showRecent?: boolean
  maxArticles?: number
  onArticleClick?: (article: HelpArticle) => void
  onCategoryClick?: (category: HelpCategory) => void
  className?: string
}

export function DashboardHelp({ 
  title = 'Pusat Bantuan', 
  showCategories = true,
  showSearch = true,
  showFavorites = true,
  showRecent = true,
  maxArticles = 10,
  onArticleClick,
  onCategoryClick,
  className = '' 
}: DashboardHelpProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set())
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const helpCategories: HelpCategory[] = [
    {
      id: 'getting-started',
      name: 'Memulai',
      description: 'Panduan dasar untuk memulai menggunakan sistem',
      icon: Zap,
      color: 'bg-blue-100 text-blue-800',
      articleCount: 5
    },
    {
      id: 'user-management',
      name: 'Manajemen Pengguna',
      description: 'Cara mengelola pengguna dan hak akses',
      icon: Users,
      color: 'bg-green-100 text-green-800',
      articleCount: 8
    },
    {
      id: 'documents',
      name: 'Dokumen',
      description: 'Cara mengelola dan mengorganisir dokumen',
      icon: FileText,
      color: 'bg-purple-100 text-purple-800',
      articleCount: 12
    },
    {
      id: 'tasks',
      name: 'Tugas',
      description: 'Cara membuat, menugaskan, dan melacak tugas',
      icon: CheckSquare,
      color: 'bg-orange-100 text-orange-800',
      articleCount: 10
    },
    {
      id: 'attendance',
      name: 'Kehadiran',
      description: 'Cara mengelola sistem kehadiran dan absensi',
      icon: Clock,
      color: 'bg-indigo-100 text-indigo-800',
      articleCount: 6
    },
    {
      id: 'leave-management',
      name: 'Manajemen Izin',
      description: 'Cara mengelola permohonan izin dan cuti',
      icon: Calendar,
      color: 'bg-pink-100 text-pink-800',
      articleCount: 7
    },
    {
      id: 'wfh',
      name: 'Work From Home',
      description: 'Cara mengelola dan memantau WFH',
      icon: Home,
      color: 'bg-yellow-100 text-yellow-800',
      articleCount: 4
    },
    {
      id: 'settings',
      name: 'Pengaturan',
      description: 'Konfigurasi sistem dan preferensi',
      icon: Settings,
      color: 'bg-gray-100 text-gray-800',
      articleCount: 9
    }
  ]

  const helpArticles: HelpArticle[] = [
    {
      id: '1',
      title: 'Cara Login ke Sistem',
      content: 'Untuk login ke sistem, gunakan email dan password yang telah diberikan oleh administrator. Pastikan Anda menggunakan browser yang kompatibel dan koneksi internet yang stabil.',
      category: 'getting-started',
      tags: ['login', 'authentication', 'browser'],
      difficulty: 'beginner',
      lastUpdated: '2024-01-15',
      views: 1250,
      helpful: 89,
      videoUrl: 'https://example.com/video1'
    },
    {
      id: '2',
      title: 'Mengelola Hak Akses Pengguna',
      content: 'Admin dapat mengelola hak akses pengguna melalui menu Users > Permissions. Setiap pengguna dapat memiliki role yang berbeda seperti Admin, Manager, atau Employee.',
      category: 'user-management',
      tags: ['permissions', 'roles', 'admin'],
      difficulty: 'intermediate',
      lastUpdated: '2024-01-10',
      views: 890,
      helpful: 67,
      externalLinks: ['https://example.com/docs/permissions']
    },
    {
      id: '3',
      title: 'Upload dan Organisasi Dokumen',
      content: 'Dokumen dapat diupload melalui menu Documents > Upload. Gunakan folder untuk mengorganisir dokumen dengan baik. Setiap dokumen dapat memiliki tag dan deskripsi.',
      category: 'documents',
      tags: ['upload', 'organization', 'folders'],
      difficulty: 'beginner',
      lastUpdated: '2024-01-12',
      views: 1100,
      helpful: 78,
      videoUrl: 'https://example.com/video2'
    },
    {
      id: '4',
      title: 'Membuat dan Menugaskan Tugas',
      content: 'Tugas baru dapat dibuat melalui menu Tasks > New Task. Berikan judul, deskripsi, deadline, dan assignee yang jelas. Gunakan prioritas untuk mengatur urgensi tugas.',
      category: 'tasks',
      tags: ['create', 'assign', 'deadline', 'priority'],
      difficulty: 'intermediate',
      lastUpdated: '2024-01-08',
      views: 950,
      helpful: 72
    },
    {
      id: '5',
      title: 'Sistem Absensi Otomatis',
      content: 'Sistem absensi menggunakan GPS dan waktu untuk memverifikasi kehadiran. Pastikan lokasi Anda berada dalam radius kantor dan waktu absen sesuai dengan jam kerja.',
      category: 'attendance',
      tags: ['gps', 'location', 'time', 'verification'],
      difficulty: 'beginner',
      lastUpdated: '2024-01-14',
      views: 1350,
      helpful: 95
    },
    {
      id: '6',
      title: 'Pengajuan Izin dan Cuti',
      content: 'Untuk mengajukan izin, buka menu Leave Requests > New Request. Pilih jenis izin, tanggal, dan alasan. Upload dokumen pendukung jika diperlukan.',
      category: 'leave-management',
      tags: ['request', 'leave', 'approval', 'documents'],
      difficulty: 'beginner',
      lastUpdated: '2024-01-11',
      views: 980,
      helpful: 81
    },
    {
      id: '7',
      title: 'Log WFH dan Validasi',
      content: 'WFH dapat dilakukan dengan mengisi log harian. Setiap log harus berisi aktivitas yang dilakukan dan bukti kerja. Admin akan memvalidasi setiap log WFH.',
      category: 'wfh',
      tags: ['log', 'validation', 'activities', 'proof'],
      difficulty: 'intermediate',
      lastUpdated: '2024-01-09',
      views: 720,
      helpful: 58
    },
    {
      id: '8',
      title: 'Konfigurasi Notifikasi',
      content: 'Pengaturan notifikasi dapat diubah melalui Profile > Settings > Notifications. Pilih jenis notifikasi yang ingin diterima dan frekuensi pengirimannya.',
      category: 'settings',
      tags: ['notifications', 'preferences', 'frequency'],
      difficulty: 'beginner',
      lastUpdated: '2024-01-13',
      views: 650,
      helpful: 45
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    }
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getDifficultyLabel = (difficulty: string) => {
    const labels = {
      beginner: 'Pemula',
      intermediate: 'Menengah',
      advanced: 'Lanjutan'
    }
    return labels[difficulty as keyof typeof labels] || difficulty
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const toggleArticleExpanded = (articleId: string) => {
    const newExpanded = new Set(expandedArticles)
    if (newExpanded.has(articleId)) {
      newExpanded.delete(articleId)
    } else {
      newExpanded.add(articleId)
    }
    setExpandedArticles(newExpanded)
  }

  const toggleFavorite = (articleId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(articleId)) {
      newFavorites.delete(articleId)
    } else {
      newFavorites.add(articleId)
    }
    setFavorites(newFavorites)
  }

  const filteredArticles = helpArticles.filter(article => {
    const matchesCategory = !selectedCategory || article.category === selectedCategory
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSearch
  }).slice(0, maxArticles)

  const recentArticles = helpArticles
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 5)

  const favoriteArticles = helpArticles.filter(article => favorites.has(article.id))

  const handleCategoryClick = (category: HelpCategory) => {
    setSelectedCategory(selectedCategory === category.id ? null : category.id)
    onCategoryClick?.(category)
  }

  const handleArticleClick = (article: HelpArticle) => {
    onArticleClick?.(article)
  }

  const renderCategories = () => {
    if (!showCategories) return null

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Kategori Bantuan
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {helpCategories.map(category => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.id
            
            return (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {category.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {category.articleCount} artikel
                    </p>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${
                    isSelected ? 'rotate-90' : ''
                  }`} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderSearch = () => {
    if (!showSearch) return null

    return (
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari artikel bantuan..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    )
  }

  const renderFavorites = () => {
    if (!showFavorites || favoriteArticles.length === 0) return null

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Artikel Favorit
        </h3>
        <div className="space-y-3">
          {favoriteArticles.map(article => (
            <div
              key={article.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleArticleClick(article)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {article.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className={`px-2 py-1 rounded-full ${getDifficultyColor(article.difficulty)}`}>
                      {getDifficultyLabel(article.difficulty)}
                    </span>
                    <span>{article.views} dilihat</span>
                    <span>{article.helpful} membantu</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(article.id)
                  }}
                  className="text-yellow-500 hover:text-yellow-600"
                >
                  <Star className="h-5 w-5 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderRecent = () => {
    if (!showRecent) return null

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Artikel Terbaru
        </h3>
        <div className="space-y-3">
          {recentArticles.map(article => (
            <div
              key={article.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleArticleClick(article)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {article.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className={`px-2 py-1 rounded-full ${getDifficultyColor(article.difficulty)}`}>
                      {getDifficultyLabel(article.difficulty)}
                    </span>
                    <span>Diperbarui {formatDate(article.lastUpdated)}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderArticles = () => {
    if (filteredArticles.length === 0) {
      return (
        <div className="text-center py-8">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Tidak ada artikel yang ditemukan
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Coba ubah filter atau kata kunci pencarian Anda.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {filteredArticles.map(article => {
          const isExpanded = expandedArticles.has(article.id)
          const isFavorite = favorites.has(article.id)
          
          return (
            <div
              key={article.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="p-4 cursor-pointer" onClick={() => handleArticleClick(article)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {article.title}
                    </h4>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-2 py-1 rounded-full ${getDifficultyColor(article.difficulty)} text-xs`}>
                        {getDifficultyLabel(article.difficulty)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {article.views} dilihat
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {article.helpful} membantu
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Diperbarui {formatDate(article.lastUpdated)}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {article.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(article.id)
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        isFavorite 
                          ? 'text-yellow-500 hover:text-yellow-600' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleArticleExpanded(article.id)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="pt-4">
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {article.content}
                    </p>
                    
                    <div className="flex items-center space-x-4">
                      {article.videoUrl && (
                        <a
                          href={article.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <Video className="h-4 w-4" />
                          <span>Tonton Video</span>
                        </a>
                      )}
                      
                      {article.externalLinks && article.externalLinks.length > 0 && (
                        <a
                          href={article.externalLinks[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Baca Lebih Lanjut</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <BookOpen className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
          </div>

          {renderSearch()}
          {renderCategories()}
          {renderFavorites()}
          {renderRecent()}
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {selectedCategory 
                ? `Artikel: ${helpCategories.find(c => c.id === selectedCategory)?.name}`
                : 'Semua Artikel'
              }
            </h3>
            {renderArticles()}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

// Predefined help configurations
export const adminHelpConfig = {
  title: 'Pusat Bantuan Admin',
  showCategories: true,
  showSearch: true,
  showFavorites: true,
  showRecent: true,
  maxArticles: 15
}

export const employeeHelpConfig = {
  title: 'Pusat Bantuan Karyawan',
  showCategories: true,
  showSearch: true,
  showFavorites: true,
  showRecent: true,
  maxArticles: 10
}

export const quickHelpConfig = {
  title: 'Bantuan Cepat',
  showCategories: false,
  showSearch: true,
  showFavorites: false,
  showRecent: true,
  maxArticles: 5
}

export const comprehensiveHelpConfig = {
  title: 'Dokumentasi Lengkap',
  showCategories: true,
  showSearch: true,
  showFavorites: true,
  showRecent: true,
  maxArticles: 25
}
