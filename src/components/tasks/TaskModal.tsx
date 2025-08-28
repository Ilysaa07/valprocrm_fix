'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { X, AlertCircle, CheckCircle } from 'lucide-react'

interface Task {
  id?: string
  title: string
  description: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_VALIDATION' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignment: 'SPECIFIC' | 'ALL_EMPLOYEES'
  assigneeId?: string
  dueDate?: string
  tags: string[]
  createdAt?: string
}

interface User {
  id: string
  fullName: string
  email: string
  role: string
  status: string
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void
  users: User[]
}

export default function TaskModal({ isOpen, onClose, task, onSave, users }: TaskModalProps) {
  const [formData, setFormData] = useState<Task>({
    title: '',
    description: '',
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    assignment: 'ALL_EMPLOYEES',
    assigneeId: '',
    dueDate: '',
    tags: []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newTag, setNewTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (task) {
      setFormData({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignment: task.assignment,
        assigneeId: task.assigneeId || '',
        dueDate: task.dueDate || '',
        tags: Array.isArray(task.tags) ? task.tags : []
      })
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
        assignment: 'ALL_EMPLOYEES',
        assigneeId: '',
        dueDate: '',
        tags: []
      })
    }
    setErrors({})
    setIsSubmitting(false)
  }, [task, isOpen])

  useEffect(() => {
    console.log('TaskModal users:', users)
  }, [users])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Judul harus diisi'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi harus diisi'
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Tanggal jatuh tempo tidak boleh di masa lalu'
    }

    if (formData.assignment === 'SPECIFIC' && !formData.assigneeId) {
      newErrors.assigneeId = 'Karyawan harus dipilih untuk tugas spesifik'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        assignment: formData.assignment,
        assigneeId: formData.assigneeId || undefined,
        dueDate: formData.dueDate || undefined,
        tags: formData.tags
      }

      console.log('Submitting task data:', taskData)
      await onSave(taskData)
      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {task ? 'Edit Tugas' : 'Buat Tugas Baru'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Judul *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Masukkan judul tugas"
                className={errors.title ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deskripsi *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Masukkan deskripsi tugas"
                rows={4}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Task['status'] }))}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="NOT_STARTED">Belum Dimulai</option>
                  <option value="IN_PROGRESS">Sedang Berlangsung</option>
                  <option value="PENDING_VALIDATION">Menunggu Validasi</option>
                  <option value="COMPLETED">Selesai</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prioritas
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="LOW">Rendah</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HIGH">Tinggi</option>
                  <option value="URGENT">Mendesak</option>
                </select>
              </div>
            </div>

            {/* Assignment Type and Assignee */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipe Penugasan
                </label>
                <select
                  value={formData.assignment}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    assignment: e.target.value as 'SPECIFIC' | 'ALL_EMPLOYEES',
                    assigneeId: e.target.value === 'ALL_EMPLOYEES' ? '' : prev.assigneeId
                  }))}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="SPECIFIC">Karyawan Spesifik</option>
                  <option value="ALL_EMPLOYEES">Semua Karyawan</option>
                </select>
              </div>
              
              {formData.assignment === 'SPECIFIC' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Karyawan *
                  </label>
                  <select
                    value={formData.assigneeId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 ${
                      errors.assigneeId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Pilih karyawan</option>
                    {users && users.length > 0 ? (
                      users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.fullName} ({user.email})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Tidak ada karyawan tersedia</option>
                    )}
                  </select>
                  {errors.assigneeId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.assigneeId}
                    </p>
                  )}
                  {users && users.length === 0 && (
                    <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Tidak ada karyawan yang tersedia untuk assignment
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tanggal Jatuh Tempo
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                disabled={isSubmitting}
                className={errors.dueDate ? 'border-red-500' : ''}
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.dueDate}
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tag
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Tambah tag"
                  disabled={isSubmitting}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={!newTag.trim() || isSubmitting}
                >
                  Tambah
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        disabled={isSubmitting}
                        className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<CheckCircle className="w-4 h-4" />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menyimpan...' : (task ? 'Perbarui Tugas' : 'Buat Tugas')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
