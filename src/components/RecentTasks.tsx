'use client'

import { Card, CardBody } from '@/components/ui/Card'
import Link from 'next/link'
import { CheckSquare, Calendar, Clock } from 'lucide-react'

interface Task {
  id: string
  title: string
  status: string
  dueDate: string | null
  createdAt: string
  description?: string
}

interface RecentTasksProps {
  tasks: Task[]
  title?: string
  viewAllHref?: string
  emptyMessage?: string
  emptyDescription?: string
  maxDisplay?: number
  className?: string
}

export function RecentTasks({ 
  tasks, 
  title = 'Tugas Terbaru', 
  viewAllHref, 
  emptyMessage = 'Belum ada tugas',
  emptyDescription = 'Tugas yang diberikan akan muncul di sini.',
  maxDisplay = 3,
  className = '' 
}: RecentTasksProps) {
  const getStatusBadge = (status: string) => {
    const styles = {
      NOT_STARTED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200',
      PENDING_VALIDATION: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200'
    }
    
    const labels = {
      NOT_STARTED: 'Belum Dikerjakan',
      IN_PROGRESS: 'Sedang Dikerjakan',
      COMPLETED: 'Selesai',
      PENDING_VALIDATION: 'Menunggu Validasi'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.NOT_STARTED}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Tidak ada tenggat'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className={className}>
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {viewAllHref && (
            <Link 
              href={viewAllHref} 
              className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
            >
              Lihat Semua
            </Link>
          )}
        </div>
        
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{emptyMessage}</h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{emptyDescription}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.slice(0, maxDisplay).map((task) => (
              <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate flex-1 mr-2">
                    {task.title}
                  </h4>
                  {getStatusBadge(task.status)}
                </div>
                
                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {task.description}
                  </p>
                )}
                
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Dibuat {formatTime(task.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {tasks.length > maxDisplay && viewAllHref && (
              <div className="text-center pt-2">
                <Link 
                  href={viewAllHref}
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                >
                  Lihat {tasks.length - maxDisplay} tugas lainnya →
                </Link>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
