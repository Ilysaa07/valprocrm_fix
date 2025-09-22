'use client'

import React from 'react'
import { BarChart3, Calendar, Target, DollarSign, FileText } from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface SwipeableTabNavigationProps {
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'attendance', label: 'Kehadiran', icon: Calendar },
  { id: 'tasks', label: 'Tugas', icon: Target },
  { id: 'financial', label: 'Keuangan', icon: DollarSign },
  { id: 'documents', label: 'Dokumen', icon: FileText }
]

export const SwipeableTabNavigation: React.FC<SwipeableTabNavigationProps> = ({
  activeTab,
  onTabChange,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Desktop tabs */}
      <div className="hidden sm:block border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100'
                }
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      {/* Mobile swipeable tabs */}
      <div className="sm:hidden">
        <div className="flex overflow-x-auto scrollbar-hide space-x-3 pb-2 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shadow-sm'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <tab.icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SwipeableTabNavigation
