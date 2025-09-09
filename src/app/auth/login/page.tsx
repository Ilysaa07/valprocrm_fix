'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, Mail, Lock, Users, BarChart3, Shield,
  ArrowRight, ChevronDown,
} from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [focusedField, setFocusedField] = useState('')
  const [showFeatures, setShowFeatures] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'Akun Anda belum disetujui oleh admin') {
          setError('Akun Anda belum disetujui oleh admin. Silakan tunggu persetujuan.')
        } else {
          setError('Email atau password salah')
        }
      } else if (result?.ok) {
        router.push('/')
      }
    } catch {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: Users,
      title: 'Manajemen Tim',
      description: 'Kelola tim dan karyawan dengan sistem yang terintegrasi dan mudah digunakan',
    },
    {
      icon: BarChart3,
      title: 'Analisis & Laporan',
      description: 'Dashboard analitik real-time untuk monitoring performa bisnis secara menyeluruh',
    },
    {
      icon: Shield,
      title: 'Keamanan Tingkat Enterprise',
      description: 'Sistem keamanan berlapis dengan enkripsi end-to-end dan audit trail',
    },
  ]

  if (!mounted) return null

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:px-6 lg:px-8 relative z-10 min-h-screen lg:min-h-auto">
        <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8 animate-fadeIn">

          {/* Logo & Heading */}
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="flex justify-center mb-6 sm:mb-10">
              <Image
                src="/logometa.png"
                alt="Valpro Intertech"
                width={200}
                height={60}
                className="h-12 sm:h-16 w-auto"
                priority
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent leading-tight">
                Selamat Datang Kembali
              </h1>
              <p className="text-gray-600 text-sm sm:text-base px-2">
                Masuk ke portal manajemen Valpro Intertech
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake mx-2 sm:mx-0">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 px-2 sm:px-0">
            <div className="space-y-4 sm:space-y-5">
              {/* Email Field */}
              <div className="relative group">
                <label className={`block text-sm font-medium mb-2 transition-colors ${
                  focusedField === 'email' ? 'text-[#253994]' : 'text-gray-700'
                }`}>
                  Email
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                    focusedField === 'email' ? 'text-[#253994]' : 'text-gray-400'
                  }`} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    required
                    className="w-full pl-9 sm:pl-10 pr-4 py-3 sm:py-3.5 text-base border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm hover:border-gray-400 focus:ring-2 focus:ring-[#253994]/20 focus:border-[#253994] transition-all"
                    placeholder="Masukkan email Anda"
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="relative group">
                <label className={`block text-sm font-medium mb-2 transition-colors ${
                  focusedField === 'password' ? 'text-[#253994]' : 'text-gray-700'
                }`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                    focusedField === 'password' ? 'text-[#253994]' : 'text-gray-400'
                  }`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    required
                    className="w-full pl-9 sm:pl-10 pr-12 py-3 sm:py-3.5 text-base border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm hover:border-gray-400 focus:ring-2 focus:ring-[#253994]/20 focus:border-[#253994] transition-all"
                    placeholder="Masukkan password Anda"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-100 transition-colors touch-manipulation"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#253994] to-[#1e2d7a] text-white py-3.5 sm:py-4 px-4 rounded-xl hover:from-[#1e2d7a] hover:to-[#253994] focus:ring-2 focus:ring-[#253994] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl group touch-manipulation"
            >
              <div className="flex items-center justify-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-base">Memproses...</span>
                  </>
                ) : (
                  <>
                    <span className="text-base">Masuk ke Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </div>
            </button>

            {/* Link Daftar */}
            <div className="text-center pt-2">
              <p className="text-gray-600 text-sm">
                Belum punya akun?{' '}
                <Link
                  href="/auth/register"
                  className="text-[#253994] hover:text-[#1e2d7a] font-medium hover:underline touch-manipulation"
                >
                  Daftar Sekarang
                </Link>
              </p>
            </div>
          </form>

          {/* Mobile Features Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFeatures(!showFeatures)}
              className="w-full flex items-center justify-center space-x-2 py-3 text-gray-600 hover:text-gray-800 transition-colors touch-manipulation"
            >
              <span className="text-sm font-medium">Lihat Fitur Platform</span>
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${showFeatures ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {/* Mobile Features */}
            <div className={`overflow-hidden transition-all duration-300 ${
              showFeatures ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="space-y-3 pt-4 px-2">
                {features.map((feature, index) => (
                  <div
                    key={feature.title}
                    className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100 hover:bg-white/80 transition-all animate-slideInFromBottom"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#253994]/10 p-2 rounded-lg flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-[#253994]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">{feature.title}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Side Right Info */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#253994] via-[#1e2d7a] to-[#162458] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-32 h-32 border border-white/10 rounded-full animate-float" />
          <div className="absolute bottom-20 left-20 w-24 h-24 border border-white/10 rounded-full animate-float-delayed" />
          <div className="absolute top-1/2 right-1/3 w-16 h-16 border border-white/10 rounded-full animate-float-slow" />
        </div>

        <div className="flex flex-col justify-center items-center p-8 text-white relative z-10">
          <div className="max-w-lg text-center space-y-8 animate-slideInFromRight">
            <div className="space-y-6">
              <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
                Solusi Manajemen
                <span className="block text-transparent bg-gradient-to-r from-blue-200 to-white bg-clip-text">
                  Perusahaan Modern
                </span>
              </h2>
              <p className="text-lg text-blue-100 leading-relaxed">
                Platform terintegrasi untuk mengelola proyek, tim, dan operasional bisnis 
                dengan teknologi terdepan dan antarmuka yang intuitif.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left hover:bg-white/15 transition-all transform hover:translate-x-2 group animate-slideInFromRight"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30">
                      <feature.icon className="w-5 h-5 text-blue-200" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 group-hover:text-white">{feature.title}</h3>
                      <p className="text-sm text-blue-100">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideInFromBottom {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-slideInFromRight { animation: slideInFromRight 0.8s ease-out; }
        .animate-slideInFromBottom { animation: slideInFromBottom 0.6s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite 2s; }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite 4s; }

        @media (max-width: 640px) {
          /* Ensure smooth scrolling on mobile */
          html {
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Prevent zoom on input focus */
          input[type="email"], input[type="password"] {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}