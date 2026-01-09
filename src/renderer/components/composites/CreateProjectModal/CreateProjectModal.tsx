/**
 * CreateProjectModal
 * Modal form for creating a new project
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../../primitives/Modal'
import { Input } from '../../primitives/Input'
import { Button } from '../../primitives/Button'
import { useUIStore, useModalOpen } from '../../../stores/ui.store'
import { useServerStore } from '../../../stores/server.store'

export const CreateProjectModal: React.FC = () => {
  const navigate = useNavigate()
  const isOpen = useModalOpen('createProject')
  const closeModal = useUIStore((s) => s.closeModal)
  const showToast = useUIStore((s) => s.showToast)
  const createProject = useServerStore((s) => s.createProject)

  const [name, setName] = useState('')
  const [path, setPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; path?: string }>({})

  const handleClose = () => {
    // Reset form
    setName('')
    setPath('')
    setErrors({})
    setLoading(false)
    closeModal('createProject')
  }

  const handleBrowse = async () => {
    try {
      const selectedPath = await window.api.invoke('system:selectFolder', {
        title: 'Select Project Location',
      })
      if (selectedPath) {
        setPath(selectedPath as string)
        setErrors((prev) => ({ ...prev, path: undefined }))
      }
    } catch (error) {
      console.error('Failed to select folder:', error)
    }
  }

  const validate = (): boolean => {
    const newErrors: { name?: string; path?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Project name is required'
    }

    if (!path.trim()) {
      newErrors.path = 'Project path is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    try {
      const project = await createProject({
        name: name.trim(),
        path: path.trim(),
      })

      showToast({
        type: 'success',
        message: `Project "${project.name}" created successfully`,
      })

      handleClose()

      // Navigate to the new project
      navigate(`/projects/${project.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)

      // Handle specific error types
      const err = error as { code?: string; message?: string }
      if (err.code === 'DUPLICATE') {
        setErrors({ path: 'A project with this path already exists' })
      } else if (err.code === 'VALIDATION_ERROR') {
        // Check which field the error is about
        if (err.message?.includes('path')) {
          setErrors({ path: err.message })
        } else {
          setErrors({ name: err.message })
        }
      } else {
        showToast({
          type: 'error',
          message: err.message || 'Failed to create project',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Create New Project"
      width="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
          >
            Create Project
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          value={name}
          onChange={setName}
          placeholder="My Awesome Project"
          error={errors.name}
          disabled={loading}
          autoFocus
        />

        <div>
          <label className="block mb-1.5 text-sm font-medium text-stone-700">
            Project Location
          </label>
          <div className="flex gap-2">
            <Input
              value={path}
              onChange={setPath}
              placeholder="/path/to/project"
              error={errors.path}
              disabled={loading}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleBrowse}
              disabled={loading}
            >
              Browse
            </Button>
          </div>
          {errors.path && (
            <p className="mt-1.5 text-xs text-red-600">{errors.path}</p>
          )}
        </div>

        <p className="text-xs text-stone-500 mt-2">
          A new directory structure will be created with META/CORE/ folders
          containing template files.
        </p>
      </form>
    </Modal>
  )
}
