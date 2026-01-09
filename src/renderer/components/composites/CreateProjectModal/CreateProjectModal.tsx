/**
 * CreateProjectModal
 * Modal form for creating a new project (GitHub-first)
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
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string }>({})

  const handleClose = () => {
    // Reset form
    setName('')
    setDescription('')
    setIsPrivate(false)
    setErrors({})
    setLoading(false)
    closeModal('createProject')
  }

  const validate = (): boolean => {
    const newErrors: { name?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Project name is required'
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name.trim())) {
      newErrors.name = 'Name must start with a letter/number and contain only letters, numbers, hyphens, underscores'
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
        description: description.trim() || undefined,
        private: isPrivate,
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
      if (err.code === 'GITHUB_NOT_AUTHENTICATED') {
        showToast({
          type: 'error',
          message: 'Please connect GitHub in Settings first',
        })
      } else if (err.code === 'GITHUB_CLI_NOT_FOUND') {
        showToast({
          type: 'error',
          message: 'GitHub CLI not found. Please install gh from https://cli.github.com',
        })
      } else if (err.code === 'GITHUB_REPO_EXISTS') {
        setErrors({ name: 'A repository with this name already exists' })
      } else if (err.code === 'VALIDATION_ERROR') {
        setErrors({ name: err.message })
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
        <div>
          <Input
            label="Project Name"
            value={name}
            onChange={setName}
            placeholder="my-awesome-project"
            error={errors.name}
            disabled={loading}
            autoFocus
          />
          <p className="mt-1 text-xs text-stone-500">Also used as GitHub repository name</p>
        </div>

        <div>
          <Input
            label="Description (optional)"
            value={description}
            onChange={setDescription}
            placeholder="A brief description of your project"
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="private-repo"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            disabled={loading}
            className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="private-repo" className="text-sm text-stone-700">
            Private repository
          </label>
        </div>

        <p className="text-xs text-stone-500 mt-2">
          A new GitHub repository will be created and cloned to your projects folder.
          The META/CORE/ directory structure will be set up automatically.
        </p>
      </form>
    </Modal>
  )
}
