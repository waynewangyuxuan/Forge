/**
 * DeleteProjectModal
 * Modal for confirming project deletion with options for GitHub and local files
 */

import React, { useState } from 'react'
import { Modal } from '../../primitives/Modal'
import { Button } from '../../primitives/Button'
import { useUIStore, useDeleteProjectModal } from '../../../stores/ui.store'
import { useServerStore } from '../../../stores/server.store'

export const DeleteProjectModal: React.FC = () => {
  const { open, projectId, projectName, hasGitHub } = useDeleteProjectModal()
  const closeModal = useUIStore((s) => s.closeModal)
  const showToast = useUIStore((s) => s.showToast)
  const deleteProject = useServerStore((s) => s.deleteProject)

  const [deleteFromGitHub, setDeleteFromGitHub] = useState(false)
  const [deleteLocalFiles, setDeleteLocalFiles] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setDeleteFromGitHub(false)
    setDeleteLocalFiles(false)
    setLoading(false)
    closeModal('deleteProject')
  }

  const handleDelete = async () => {
    if (!projectId) return

    setLoading(true)
    try {
      await deleteProject(projectId, {
        deleteFromGitHub,
        deleteLocalFiles,
      })

      const deletedParts = ['database']
      if (deleteFromGitHub) deletedParts.push('GitHub')
      if (deleteLocalFiles) deletedParts.push('local files')

      showToast({
        type: 'success',
        message: `Project "${projectName}" deleted from ${deletedParts.join(', ')}`,
      })

      handleClose()
    } catch (error) {
      console.error('Failed to delete project:', error)
      const err = error as { code?: string; message?: string }

      if (err.code === 'GITHUB_NOT_AUTHENTICATED') {
        showToast({
          type: 'error',
          message: 'GitHub authentication required to delete repository',
        })
      } else {
        showToast({
          type: 'error',
          message: err.message || 'Failed to delete project',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Delete Project"
      width="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDelete}
            loading={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete Project
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-stone-700">
          Are you sure you want to delete <strong>{projectName}</strong>?
        </p>

        <div className="space-y-3 py-2">
          <p className="text-sm text-stone-500 font-medium">
            The project will be removed from Forge. Optionally, you can also:
          </p>

          {hasGitHub && (
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="delete-github"
                checked={deleteFromGitHub}
                onChange={(e) => setDeleteFromGitHub(e.target.checked)}
                disabled={loading}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="delete-github" className="text-sm text-stone-700">
                <span className="font-medium">Delete GitHub repository</span>
                <p className="text-stone-500 text-xs mt-0.5">
                  Permanently delete the repository from GitHub. This cannot be undone.
                </p>
              </label>
            </div>
          )}

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="delete-local"
              checked={deleteLocalFiles}
              onChange={(e) => setDeleteLocalFiles(e.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 rounded border-stone-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="delete-local" className="text-sm text-stone-700">
              <span className="font-medium">Delete local files</span>
              <p className="text-stone-500 text-xs mt-0.5">
                Remove the project folder from your computer.
              </p>
            </label>
          </div>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-sm text-amber-800">
            {deleteFromGitHub || deleteLocalFiles ? (
              <>
                <strong>Warning:</strong> Selected deletions are permanent and cannot be undone.
              </>
            ) : (
              <>
                The project folder and GitHub repository will be preserved.
                You can re-import the project later.
              </>
            )}
          </p>
        </div>
      </div>
    </Modal>
  )
}
