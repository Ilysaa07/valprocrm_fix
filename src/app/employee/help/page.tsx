"use client"

import React, { useState } from 'react'
import { 
  Search, 
  MessageCircle, 
  Download, 
  Video, 
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Clock,
  Star,
  BookOpen,
  FileText,
  User,
  Settings,
  Calendar,
  CheckSquare
} from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
}

interface TutorialItem {
  id: string
  title: string
  description: string
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  steps: string[]
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Bagaimana cara mengajukan cuti?',
    answer: 'Untuk mengajukan cuti, buka menu Permintaan Cuti > Ajukan Cuti Baru. Isi formulir dengan tanggal cuti, alasan, dan lampirkan dokumen pendukung jika diperlukan. Permintaan akan direview oleh supervisor Anda.',
    category: 'Cuti & Izin',
    tags: ['cuti', 'izin', 'formulir']
  },
  {
    id: '2',
    question: 'Cara melaporkan kehadiran harian?',
    answer: 'Kehadiran harian dapat dilaporkan melalui menu Kehadiran > Lapor Kehadiran. Klik tombol "Check In" saat tiba di kantor dan "Check Out" saat pulang. Sistem akan mencatat waktu otomatis.',
    category: 'Kehadiran',
    tags: ['kehadiran', 'check-in', 'check-out']
  },
  {
    id: '3',
    question: 'Bagaimana cara mengakses dokumen perusahaan?',
    answer: 'Dokumen perusahaan tersedia di menu Dokumen. Gunakan fitur pencarian untuk menemukan dokumen yang Anda butuhkan. Pastikan Anda memiliki izin akses untuk dokumen tersebut.',
    category: 'Dokumen',
    tags: ['dokumen', 'akses', 'pencarian']
  },
  {
    id: '4',
    question: 'Cara mengubah password akun?',
    answer: 'Untuk mengubah password, buka menu Profil Saya > Pengaturan > Ubah Password. Masukkan password lama, password baru, dan konfirmasi password baru. Password minimal 8 karakter.',
    category: 'Akun',
    tags: ['password', 'akun', 'keamanan']
  },
  {
    id: '5',
    question: 'Bagaimana cara melaporkan WFH?',
    answer: 'Laporan WFH dapat dibuat melalui menu WFH Log > Tambah Laporan. Isi detail aktivitas yang dilakukan, jam kerja, dan hasil yang dicapai. Laporan akan disimpan untuk evaluasi kinerja.',
    category: 'WFH',
    tags: ['wfh', 'laporan', 'aktivitas']
  }
]

const tutorialData: TutorialItem[] = [
  {
    id: '1',
    title: 'Memulai dengan Employee Portal',
    description: 'Panduan lengkap untuk karyawan baru dalam menggunakan sistem',
    duration: '10 menit',
    difficulty: 'Beginner',
    steps: [
      'Login ke sistem dengan kredensial yang diberikan',
      'Pahami dashboard dan menu utama',
      'Laporkan kehadiran harian',
      'Akses dokumen dan informasi perusahaan',
      'Pelajari fitur chat dan komunikasi'
    ]
  },
  {
    id: '2',
    title: 'Manajemen Tugas dan Proyek',
    description: 'Cara mengelola tugas pribadi dan proyek tim dengan efektif',
    duration: '15 menit',
    difficulty: 'Intermediate',
    steps: [
      'Buka menu Tugas untuk melihat daftar tugas',
      'Update status tugas secara berkala',
      'Komunikasikan progress dengan tim',
      'Gunakan fitur kolaborasi dokumen',
      'Laporkan penyelesaian tugas'
    ]
  },
  {
    id: '3',
    title: 'Optimasi Produktivitas Kerja',
    description: 'Tips dan trik untuk meningkatkan produktivitas kerja harian',
    duration: '12 menit',
    difficulty: 'Intermediate',
    steps: [
      'Atur notifikasi sesuai prioritas',
      'Gunakan fitur pencarian cepat',
      'Manfaatkan template dokumen',
      'Jadwalkan reminder penting',
      'Monitor progress kinerja'
    ]
  }
]

const categories = ['All', 'Cuti & Izin', 'Kehadiran', 'Dokumen', 'Akun', 'WFH', 'Tugas']

export default function EmployeeHelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null)

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredTutorials = tutorialData.filter(item => {
    return item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.description.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <HelpCircle className="h-12 w-12 text-emerald-600" />
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Pusat Bantuan</h1>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Temukan jawaban untuk pertanyaan Anda dan pelajari cara menggunakan sistem dengan efektif
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
          <input
            type="text"
            placeholder="Cari bantuan, tutorial, atau FAQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-lg rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border border-emerald-200 dark:border-slate-600 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center space-x-3 mb-4">
            <MessageCircle className="h-8 w-8 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hubungi HR</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Butuh bantuan langsung? Tim HR siap membantu dengan pertanyaan terkait karyawan
          </p>
          <button className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200">
            Chat HR
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border border-blue-200 dark:border-slate-600 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center space-x-3 mb-4">
            <Download className="h-8 w-8 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Download Manual</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Unduh panduan lengkap dalam format PDF untuk referensi offline
          </p>
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
            Download PDF
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border border-purple-200 dark:border-slate-600 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center space-x-3 mb-4">
            <Video className="h-8 w-8 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Video Tutorial</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Tonton video tutorial interaktif untuk mempelajari fitur-fitur sistem
          </p>
          <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200">
            Tonton Video
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Pertanyaan Umum</h2>
          <p className="text-slate-600 dark:text-slate-400">Temukan jawaban untuk pertanyaan yang sering diajukan</p>
        </div>

        <div className="space-y-4">
          {filteredFAQ.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {item.question}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      {item.tags.map((tag, index) => (
                        <span key={index} className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-2 py-1 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {expandedFAQ === item.id ? (
                  <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                )}
              </button>
              
              {expandedFAQ === item.id && (
                <div className="px-6 pb-6 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tutorials Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Tutorial & Panduan</h2>
          <p className="text-slate-600 dark:text-slate-400">Pelajari cara menggunakan sistem dengan tutorial step-by-step</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tutorial.difficulty === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    tutorial.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {tutorial.difficulty}
                  </span>
                  <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                    <Clock className="h-4 w-4" />
                    <span>{tutorial.duration}</span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {tutorial.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {tutorial.description}
                </p>

                <button
                  onClick={() => setExpandedTutorial(expandedTutorial === tutorial.id ? null : tutorial.id)}
                  className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200 mb-4"
                >
                  {expandedTutorial === tutorial.id ? 'Sembunyikan' : 'Lihat Langkah'}
                </button>

                {expandedTutorial === tutorial.id && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Langkah-langkah:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      {tutorial.steps.map((step, index) => (
                        <li key={index} className="pl-2">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Masih Butuh Bantuan?</h2>
        <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">
          Tim support kami siap membantu Anda dengan pertanyaan teknis, penggunaan fitur, atau masalah lainnya
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors duration-200">
            Hubungi Support
          </button>
          <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-colors duration-200">
            Buat Ticket
          </button>
        </div>
      </div>
    </div>
  )
}
