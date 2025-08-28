'use client'

export interface ChartData {
  label: string
  value: number
  color: string
  percentage?: number
}

export interface ChartConfig {
  title: string
  description?: string
  data: ChartData[]
  showPercentage?: boolean
  showLegend?: boolean
  height?: number
}

interface ChartSummaryProps extends ChartConfig {
  className?: string
}

export function ChartSummary({ 
  title, 
  description, 
  data, 
  showPercentage = true, 
  showLegend = true,
  height = 200,
  className = '' 
}: ChartSummaryProps) {
  // Safety check for undefined data
  if (!data || !Array.isArray(data)) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          <div className="text-center py-8 text-gray-500">
            Tidak ada data untuk ditampilkan
          </div>
        </div>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  const calculatePercentage = (value: number) => {
    return total > 0 ? (value / total) * 100 : 0
  }

  const sortedData = [...data].sort((a, b) => b.value - a.value)

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        
        <div className="space-y-3">
          {sortedData.map((item, index) => {
            const percentage = calculatePercentage(item.value)
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {item.value}
                    </span>
                    {showPercentage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        ({percentage.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        
        {showLegend && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              {sortedData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {item.label}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Configuration functions for different chart types
export function attendanceChartConfig(stats: any) {
  return {
    title: 'Kehadiran Hari Ini',
    description: 'Distribusi status kehadiran karyawan',
    data: [
      {
        label: 'Hadir',
        value: stats.todayPresent || 0,
        color: '#10B981'
      },
      {
        label: 'Tidak Hadir',
        value: stats.todayAbsent || 0,
        color: '#EF4444'
      },
      {
        label: 'WFH',
        value: stats.todayWFH || 0,
        color: '#3B82F6'
      },
      {
        label: 'Sakit',
        value: stats.todaySick || 0,
        color: '#F59E0B'
      }
    ],
    showPercentage: true,
    showLegend: true
  }
}

export function taskProgressChartConfig(stats: any) {
  return {
    title: 'Progress Tugas',
    description: 'Status penyelesaian tugas',
    data: [
      {
        label: 'Selesai',
        value: stats.completedTasks || 0,
        color: '#10B981'
      },
      {
        label: 'Dalam Proses',
        value: stats.inProgressTasks || 0,
        color: '#3B82F6'
      },
      {
        label: 'Pending',
        value: stats.pendingTasks || 0,
        color: '#F59E0B'
      },
      {
        label: 'Terlambat',
        value: stats.overdueTasks || 0,
        color: '#EF4444'
      }
    ],
    showPercentage: true,
    showLegend: true
  }
}

export function leaveStatusChartConfig(stats: any) {
  return {
    title: 'Status Permohonan Izin',
    description: 'Distribusi status permohonan izin',
    data: [
      {
        label: 'Disetujui',
        value: stats.approvedLeaveRequests || 0,
        color: '#10B981'
      },
      {
        label: 'Menunggu',
        value: stats.pendingLeaveRequests || 0,
        color: '#F59E0B'
      },
      {
        label: 'Ditolak',
        value: stats.rejectedLeaveRequests || 0,
        color: '#EF4444'
      }
    ],
    showPercentage: true,
    showLegend: true
  }
}
