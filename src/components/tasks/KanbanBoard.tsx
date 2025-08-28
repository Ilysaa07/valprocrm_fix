'use client'

import { useState, useCallback } from 'react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  MoreVertical, 
  Calendar, 
  User, 
  Tag, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_VALIDATION' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignment: 'SPECIFIC' | 'ALL_EMPLOYEES'
  assigneeId?: string
  assignee?: string
  dueDate?: string
  tags: string[]
  createdAt: string
}

interface KanbanColumn {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  tasks: Task[]
  color: string
  bgColor: string
  borderColor: string
  canMoveTo: string[]
}

interface KanbanBoardProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskCreate?: (task: Omit<Task, 'id' | 'createdAt'>) => void
  onTaskDelete: (taskId: string) => void
}

const getPriorityColor = (priority: Task['priority']) => {
  switch (priority) {
    case 'LOW':
      return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
    case 'MEDIUM':
      return 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 border-accent-200 dark:border-accent-700'
    case 'HIGH':
      return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400 border-warning-200 dark:border-warning-700'
    case 'URGENT':
      return 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400 border-danger-200 dark:border-danger-700'
    default:
      return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
  }
}

const getStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'NOT_STARTED':
      return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
    case 'IN_PROGRESS':
      return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border-primary-200 dark:border-primary-700'
    case 'PENDING_VALIDATION':
      return 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 border-accent-200 dark:border-accent-700'
    case 'COMPLETED':
      return 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400 border-secondary-200 dark:border-secondary-700'
    default:
      return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
  }
}

// Modern Task Card Component
function TaskCard({ task, onMoveTask }: { task: Task; onMoveTask: (taskId: string, newStatus: Task['status']) => void }) {
  const [showMoveButtons, setShowMoveButtons] = useState(false)
  const [showStatusSelect, setShowStatusSelect] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  const getMoveOptions = (currentStatus: Task['status']) => {
    switch (currentStatus) {
      case 'NOT_STARTED':
        return [
          { 
            status: 'IN_PROGRESS' as const, 
            label: 'Mulai Kerja', 
            icon: Play, 
            color: 'bg-primary-500 hover:bg-primary-600 border-primary-500',
            description: 'Mulai mengerjakan tugas ini'
          }
        ]
      case 'IN_PROGRESS':
        return [
          { 
            status: 'NOT_STARTED' as const, 
            label: 'Tunda', 
            icon: Pause, 
            color: 'bg-neutral-500 hover:bg-neutral-600 border-neutral-500',
            description: 'Tunda tugas ini sementara'
          },
          { 
            status: 'PENDING_VALIDATION' as const, 
            label: 'Selesai', 
            icon: CheckCircle, 
            color: 'bg-accent-500 hover:bg-accent-600 border-accent-500',
            description: 'Tandai tugas sebagai selesai'
          }
        ]
      case 'PENDING_VALIDATION':
        return [
          { 
            status: 'IN_PROGRESS' as const, 
            label: 'Revisi', 
            icon: AlertCircle, 
            color: 'bg-primary-500 hover:bg-primary-600 border-primary-500',
            description: 'Kembalikan untuk revisi'
          },
          { 
            status: 'COMPLETED' as const, 
            label: 'Validasi', 
            icon: CheckCircle, 
            color: 'bg-secondary-500 hover:bg-secondary-600 border-secondary-500',
            description: 'Validasi dan selesaikan tugas'
          }
        ]
      case 'COMPLETED':
        return [
          { 
            status: 'PENDING_VALIDATION' as const, 
            label: 'Revisi', 
            icon: AlertCircle, 
            color: 'bg-accent-500 hover:bg-accent-600 border-accent-500',
            description: 'Buka kembali untuk revisi'
          }
        ]
      default:
        return []
    }
  }

  const moveOptions = getMoveOptions(task.status)

  return (
    <Card className="group hover:shadow-medium transition-all duration-200 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
      <CardBody className="p-4">
        <div className="space-y-3">
          
          {/* Task Header */}
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-neutral-900 dark:text-neutral-100 line-clamp-2 text-sm leading-tight">
              {task.title}
            </h4>
            <div className="flex items-center gap-1">
              {/* Inline status dropdown toggle */}
              <button
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                onClick={() => setShowStatusSelect(v => !v)}
                aria-label="Ubah status"
                title="Ubah status"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button 
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                onClick={() => setShowMoveButtons(!showMoveButtons)}
                aria-label="Show task options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Task Description */}
          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {task.description}
          </p>

          {/* Task Meta */}
          <div className="space-y-2">
            {/* Priority & Status */}
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>

              {!showStatusSelect ? (
                <button
                  onClick={() => setShowStatusSelect(true)}
                  className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)} hover:opacity-80 transition`}
                  title="Klik untuk ubah status"
                >
                  {task.status}
                </button>
              ) : (
                <select
                  value={task.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as Task['status']
                    onMoveTask(task.id, newStatus)
                    setShowStatusSelect(false)
                  }}
                  onBlur={() => setShowStatusSelect(false)}
                  autoFocus
                  className="px-2 py-1 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="NOT_STARTED">NOT_STARTED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="PENDING_VALIDATION">PENDING_VALIDATION</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              )}
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md border border-neutral-200 dark:border-neutral-700"
                  >
                    {tag}
                  </span>
                ))}
                {task.tags.length > 2 && (
                  <span className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md border border-neutral-200 dark:border-neutral-700">
                    +{task.tags.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Task Footer */}
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center space-x-3">
                {task.assignee && (
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span className="truncate max-w-20">{task.assignee}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatDate(task.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Move Buttons */}
          {showMoveButtons && moveOptions.length > 0 && (
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <div className="space-y-2">
                {moveOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <Button
                      key={option.status}
                      size="sm"
                      className={`w-full text-white text-xs px-3 py-2 border transition-all duration-200 hover:scale-105 ${option.color}`}
                      onClick={() => {
                        onMoveTask(task.id, option.status)
                        setShowMoveButtons(false)
                      }}
                    >
                      <IconComponent className="w-3 h-3 mr-2" />
                      {option.label}
                    </Button>
                  )
                })}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                {moveOptions[0]?.description}
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export default function KanbanBoard({ tasks, onTaskUpdate, onTaskCreate, onTaskDelete }: KanbanBoardProps) {
  const columns: KanbanColumn[] = [
    {
      id: 'NOT_STARTED',
      title: 'Belum Dimulai',
      description: 'Tugas yang belum dikerjakan',
      icon: AlertCircle,
      tasks: tasks.filter(task => task.status === 'NOT_STARTED'),
      color: 'text-neutral-600 dark:text-neutral-400',
      bgColor: 'bg-neutral-50 dark:bg-neutral-900/50',
      borderColor: 'border-neutral-200 dark:border-neutral-700',
      canMoveTo: ['IN_PROGRESS']
    },
    {
      id: 'IN_PROGRESS',
      title: 'Sedang Berlangsung',
      description: 'Tugas yang sedang dikerjakan',
      icon: Play,
      tasks: tasks.filter(task => task.status === 'IN_PROGRESS'),
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
      borderColor: 'border-primary-200 dark:border-primary-700/30',
      canMoveTo: ['NOT_STARTED', 'PENDING_VALIDATION']
    },
    {
      id: 'PENDING_VALIDATION',
      title: 'Menunggu Validasi',
      description: 'Tugas yang menunggu validasi',
      icon: CheckCircle,
      tasks: tasks.filter(task => task.status === 'PENDING_VALIDATION'),
      color: 'text-accent-600 dark:text-accent-400',
      bgColor: 'bg-accent-50 dark:bg-accent-900/20',
      borderColor: 'border-accent-200 dark:border-accent-700/30',
      canMoveTo: ['IN_PROGRESS', 'COMPLETED']
    },
    {
      id: 'COMPLETED',
      title: 'Selesai',
      description: 'Tugas yang telah selesai',
      icon: CheckCircle,
      tasks: tasks.filter(task => task.status === 'COMPLETED'),
      color: 'text-secondary-600 dark:text-secondary-400',
      bgColor: 'bg-secondary-50 dark:bg-secondary-900/20',
      borderColor: 'border-secondary-200 dark:border-secondary-700/30',
      canMoveTo: ['PENDING_VALIDATION']
    }
  ]

  const handleMoveTask = useCallback((taskId: string, newStatus: Task['status']) => {
    console.log(`Moving task ${taskId} to ${newStatus}`)
    
    try {
      onTaskUpdate(taskId, { status: newStatus })
      console.log('Task moved successfully')
    } catch (error) {
      console.error('Error moving task:', error)
    }
  }, [onTaskUpdate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Task Board
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Kelola dan pantau progress tugas tim
          </p>
        </div>
        {onTaskCreate && (
          <Button 
            onClick={() => onTaskCreate({} as Omit<Task, 'id' | 'createdAt'>)}
            className="bg-primary-500 hover:bg-primary-600 border-primary-500 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat Tugas
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            {/* Column Header */}
            <div className={`p-4 rounded-xl border-2 ${column.borderColor} ${column.bgColor} transition-all duration-200`}>
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg bg-white dark:bg-neutral-800 ${column.color}`}>
                  <column.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {column.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {column.description}
                  </p>
                </div>
              </div>
              
              {/* Task Count */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {column.tasks.length} tugas
                </span>
                <div className="flex items-center space-x-1">
                  {column.canMoveTo.map((targetStatus) => {
                    const targetColumn = columns.find(col => col.id === targetStatus)
                    if (!targetColumn) return null
                    return (
                      <div key={targetStatus} className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-3">
              {column.tasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onMoveTask={handleMoveTask}
                />
              ))}
              
              {/* Empty State */}
              {column.tasks.length === 0 && (
                <div className={`p-8 rounded-xl border-2 border-dashed ${column.borderColor} ${column.bgColor} text-center`}>
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                    <column.icon className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Tidak ada tugas
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500">
                    {column.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
