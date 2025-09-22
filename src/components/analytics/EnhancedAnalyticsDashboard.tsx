'use client'

import React, { useState, useEffect, useMemo } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { AnalyticsHeader } from './AnalyticsHeader'
import { SwipeableTabNavigation } from './SwipeableTabNavigation'
import { ResponsiveMetricsGrid } from './ResponsiveMetricsGrid'
import { EnhancedChart } from './EnhancedChart'
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  FileText,
  Activity,
  Target
} from 'lucide-react'

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  todayPresent: number
  todayAbsent: number
  todayWFH: number
  pendingLeaveRequests: number
  pendingWFHLogs: number
  totalIncome: number
  totalExpense: number
  systemUptime: number
  responseTime: number
  errorRate: number
}

interface MonthlyTrend {
  month: string
  present: number
  absent: number
  wfh: number
  leave: number
}

export default function EnhancedAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'tasks' | 'financial' | 'documents'>('overview')

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      
      const [dashboardStatsRes, monthlyTrendsRes] = await Promise.all([
        fetch('/api/admin/dashboard-stats'),
        fetch('/api/admin/analytics/monthly-trends')
      ])

      if (dashboardStatsRes.ok && monthlyTrendsRes.ok) {
        const [dashboardStats, monthlyTrendsData] = await Promise.all([
          dashboardStatsRes.json(),
          monthlyTrendsRes.json()
        ])

        const stats = dashboardStats?.data || {}
        const trends = monthlyTrendsData?.data || []

        setAnalytics({
          totalUsers: Number(stats.totalUsers || 0),
          activeUsers: Number(stats.totalUsers || 0),
          pendingUsers: Number(stats.pendingUsers || 0),
          totalTasks: Number(stats.totalTasks || 0),
          completedTasks: Number(stats.completedTasks || 0),
          pendingTasks: Number(stats.pendingTasks || 0),
          todayPresent: Number(stats.todayPresent || 0),
          todayAbsent: Number(stats.todayAbsent || 0),
          todayWFH: Number(stats.todayWFH || 0),
          pendingLeaveRequests: Number(stats.pendingLeaveRequests || 0),
          pendingWFHLogs: Number(stats.pendingWFHLogs || 0),
          totalIncome: Number(stats.totalIncome || 0),
          totalExpense: Number(stats.totalExpense || 0),
          systemUptime: 99.9,
          responseTime: 120,
          errorRate: 0.1
        })

        setMonthlyTrends(trends)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
    
    // Set up polling
    const interval = setInterval(fetchAnalyticsData, 30000)
    return () => clearInterval(interval)
  }, [selectedPeriod])

  // Generate metrics based on active tab
  const metrics = useMemo(() => {
    if (!analytics) return []

    const baseMetrics = [
      {
        title: 'Total Karyawan',
        value: analytics.totalUsers,
        change: 5,
        trend: 'up' as const,
        format: 'number' as const,
        icon: Users,
        color: 'blue' as const,
        drillDown: true
      },
      {
        title: 'Kehadiran Hari Ini',
        value: analytics.todayPresent,
        change: 2,
        trend: 'up' as const,
        format: 'number' as const,
        icon: Calendar,
        color: 'green' as const,
        drillDown: true
      },
      {
        title: 'Tugas Selesai',
        value: analytics.completedTasks,
        change: 8,
        trend: 'up' as const,
        format: 'number' as const,
        icon: CheckCircle,
        color: 'green' as const,
        drillDown: true
      },
      {
        title: 'Izin Pending',
        value: analytics.pendingLeaveRequests,
        change: -3,
        trend: 'down' as const,
        format: 'number' as const,
        icon: Clock,
        color: 'yellow' as const,
        drillDown: true
      },
      {
        title: 'Uptime Sistem',
        value: analytics.systemUptime,
        change: 0,
        trend: 'stable' as const,
        format: 'percentage' as const,
        icon: Activity,
        color: 'purple' as const
      },
      {
        title: 'Response Time',
        value: analytics.responseTime,
        change: -5,
        trend: 'down' as const,
        format: 'time' as const,
        icon: TrendingUp,
        color: 'blue' as const
      }
    ]

    switch (activeTab) {
      case 'attendance':
        return [
          {
            title: 'Hadir Hari Ini',
            value: analytics.todayPresent,
            change: 2,
            trend: 'up' as const,
            format: 'number' as const,
            icon: CheckCircle,
            color: 'green' as const,
            drillDown: true
          },
          {
            title: 'WFH Hari Ini',
            value: analytics.todayWFH,
            change: 1,
            trend: 'up' as const,
            format: 'number' as const,
            icon: Calendar,
            color: 'purple' as const,
            drillDown: true
          },
          {
            title: 'Tidak Hadir',
            value: analytics.todayAbsent,
            change: -2,
            trend: 'down' as const,
            format: 'number' as const,
            icon: AlertCircle,
            color: 'red' as const,
            drillDown: true
          }
        ]
      
      case 'tasks':
        return [
          {
            title: 'Total Tugas',
            value: analytics.totalTasks,
            change: 3,
            trend: 'up' as const,
            format: 'number' as const,
            icon: Target,
            color: 'blue' as const,
            drillDown: true
          },
          {
            title: 'Tugas Selesai',
            value: analytics.completedTasks,
            change: 8,
            trend: 'up' as const,
            format: 'number' as const,
            icon: CheckCircle,
            color: 'green' as const,
            drillDown: true
          },
          {
            title: 'Tugas Pending',
            value: analytics.pendingTasks,
            change: -5,
            trend: 'down' as const,
            format: 'number' as const,
            icon: Clock,
            color: 'yellow' as const,
            drillDown: true
          }
        ]
      
      case 'financial':
        return [
          {
            title: 'Total Pendapatan',
            value: analytics.totalIncome,
            change: 12,
            trend: 'up' as const,
            format: 'currency' as const,
            icon: DollarSign,
            color: 'green' as const,
            drillDown: true
          },
          {
            title: 'Total Pengeluaran',
            value: analytics.totalExpense,
            change: 7,
            trend: 'up' as const,
            format: 'currency' as const,
            icon: DollarSign,
            color: 'red' as const,
            drillDown: true
          },
          {
            title: 'Net Income',
            value: analytics.totalIncome - analytics.totalExpense,
            change: 15,
            trend: 'up' as const,
            format: 'currency' as const,
            icon: TrendingUp,
            color: 'blue' as const,
            drillDown: true
          }
        ]
      
      default:
        return baseMetrics
    }
  }, [analytics, activeTab])

  // Generate charts based on active tab
  const charts = useMemo(() => {
    if (!analytics) return []

    switch (activeTab) {
      case 'overview':
        return [
          {
            title: 'Distribusi Kehadiran Hari Ini',
            subtitle: 'Status kehadiran karyawan',
            type: 'pie' as const,
            data: [
              { label: 'Hadir', value: analytics.todayPresent, color: '#10B981' },
              { label: 'WFH', value: analytics.todayWFH, color: '#8B5CF6' },
              { label: 'Tidak Hadir', value: analytics.todayAbsent, color: '#EF4444' }
            ],
            showLegend: true,
            showTotal: true
          },
          {
            title: 'Status Tugas',
            subtitle: 'Progress penyelesaian tugas',
            type: 'bar' as const,
            data: [
              { label: 'Selesai', value: analytics.completedTasks, color: '#10B981' },
              { label: 'Dalam Progress', value: analytics.pendingTasks, color: '#F59E0B' },
              { label: 'Belum Dimulai', value: analytics.totalTasks - analytics.completedTasks - analytics.pendingTasks, color: '#6B7280' }
            ],
            showLegend: false,
            showTotal: false
          }
        ]
      
      case 'attendance':
        return [
          {
            title: 'Trend Kehadiran Bulanan',
            subtitle: 'Data kehadiran 6 bulan terakhir',
            type: 'bar' as const,
            data: monthlyTrends.map(trend => ({
              label: trend.month,
              value: trend.present,
              color: '#10B981'
            })),
            showLegend: false,
            showTotal: false
          }
        ]
      
      default:
        return []
    }
  }, [analytics, activeTab, monthlyTrends])

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting analytics data...')
  }

  const handleMetricClick = (metric: any) => {
    console.log('Drilling down to:', metric.title)
    // Implement drill-down functionality
  }

  if (isLoading && !analytics) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <AnalyticsHeader
          title="Analytics Dashboard"
          subtitle="Ringkasan performa sistem dan karyawan secara real-time"
          lastUpdated={lastUpdated}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          onRefresh={fetchAnalyticsData}
          onExport={handleExport}
          loading={isLoading}
        />

        {/* Tab Navigation */}
        <SwipeableTabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Metrics Grid */}
        <ResponsiveMetricsGrid
          metrics={metrics.map(metric => ({
            ...metric,
            onClick: () => handleMetricClick(metric)
          }))}
          loading={isLoading}
        />

        {/* Charts */}
        {charts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {charts.map((chart, index) => (
              <EnhancedChart
                key={index}
                title={chart.title}
                subtitle={chart.subtitle}
                type={chart.type}
                data={chart.data}
                showLegend={chart.showLegend}
                showTotal={chart.showTotal}
                onExport={handleExport}
                onDrillDown={(data) => console.log('Chart drill down:', data)}
                loading={isLoading}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
