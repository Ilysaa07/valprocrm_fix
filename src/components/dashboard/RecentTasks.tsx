'use client'

import { Card, CardBody } from '@/components/ui/Card'
import Link from 'next/link'

export interface Task {
  id: string
  title: string
  description: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  assignee: string
  dueDate: string
  progress: number
  tags?: string[]
}

interface RecentTasksProps {
  tasks: Task[]
  maxItems?: number
  showAssignee?: boolean
  showProgress?: boolean
  title?: string
  className?: string
}

export function RecentTasks({ 
  tasks, 
  maxItems = 5, 
  showAssignee = false, 
  showProgress = false,
  title,
  className = '' 
}: RecentTasksProps) {
  const displayTasks = tasks.slice(0, maxItems)
  
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    })
  }

  if (displayTasks.length === 0) {
    return (
      <Card className={className}>
        <CardBody>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {title}
            </h3>
          )}
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Tidak ada tugas terbaru
            </p>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardBody>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <Link
              href="/admin/tasks"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Lihat Semua
            </Link>
          </div>
        )}
        <div className="space-y-3">
          {displayTasks.map((task) => (
            <div
              key={task.id}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Link
                      href={`/admin/tasks/${task.id}`}
                      className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate"
                    >
                      {task.title}
                    </Link>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status === 'NOT_STARTED' && 'Belum Dimulai'}
                      {task.status === 'IN_PROGRESS' && 'Dalam Proses'}
                      {task.status === 'COMPLETED' && 'Selesai'}
                      {task.status === 'OVERDUE' && 'Terlambat'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'HIGH' && 'Tinggi'}
                      {task.priority === 'MEDIUM' && 'Sedang'}
                      {task.priority === 'LOW' && 'Rendah'}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Jatuh tempo: {formatDate(task.dueDate)}</span>
                    {showAssignee && (
                      <span>Ditugaskan ke: {task.assignee}</span>
                    )}
                  </div>
                  
                  {showProgress && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {task.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(task.progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
