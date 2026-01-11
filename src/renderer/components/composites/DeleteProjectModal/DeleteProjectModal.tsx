/**
 * DeleteProjectModal
 * Modal for confirming project deletion with options for GitHub and local files
 */

import React, { useState, useEffect } from 'react'
import { Modal } from '../../primitives/Modal'
import { Button } from '../../primitives/Button'
import { useUIStore, useDeleteProjectModal } from '../../../stores/ui.store'
import { useServerStore } from '../../../stores/server.store'
import { ErrorCodes } from '@shared/constants'
import { isSerializedError, serializeError } from '@shared/errors'

export const DeleteProjectModal: React.FC = () => {
  const { open, projectId, projectName, hasGitHub } = useDeleteProjectModal()
  const closeModal = useUIStore((s) => s.closeModal)
  const showToast = useUIStore((s) => s.showToast)
  const deleteProject = useServerStore((s) => s.deleteProject)

  const [deleteFromGitHub, setDeleteFromGitHub] = useState(false)
  const [deleteLocalFiles, setDeleteLocalFiles] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scopeError, setScopeError] = useState(false)
  const [scopeCommand, setScopeCommand] = useState('')
  const [genericError, setGenericError] = useState<string | null>(null)

  const primaryActionLabel = deleteFromGitHub
    ? 'Delete Project'
    : deleteLocalFiles
      ? 'Delete Local Files'
      : 'Remove from Forge'

  // When GitHub deletion is selected, local deletion must also be selected
  useEffect(() => {
    if (deleteFromGitHub) {
      setDeleteLocalFiles(true)
    }
  }, [deleteFromGitHub])

  const handleClose = () => {
    setDeleteFromGitHub(false)
    setDeleteLocalFiles(false)
    setLoading(false)
    setScopeError(false)
    setScopeCommand('')
    setGenericError(null)
    closeModal('deleteProject')
  }

  const handleDelete = async () => {
    if (!projectId) return

    setLoading(true)
    setScopeError(false)
    setGenericError(null)

    try {
      const result = await deleteProject(projectId, {
        deleteFromGitHub,
        deleteLocalFiles,
      })

      // Handle error result
      if (!result.ok) {
        const { error } = result

        if (error.code === ErrorCodes.GITHUB_MISSING_SCOPE) {
          // Show inline instructions with scope from details
          const scope = (error.details?.scope as string) || 'delete_repo'
          setScopeError(true)
          setScopeCommand(`gh auth refresh -h github.com -s ${scope}`)
          return
        }

        if (error.code === ErrorCodes.GITHUB_NOT_AUTHENTICATED) {
          const message = 'GitHub authentication required to delete repository'
          setGenericError(message)
          showToast({ type: 'error', message })
        } else {
          setGenericError(error.message)
          showToast({ type: 'error', message: error.message })
        }

        return
      }

      // Success - log warnings and show outcome-based toast
      const { outcome, warnings } = result.data

      // Log warnings for debugging
      warnings?.forEach((w) => console.warn(`[Delete] ${w.code}: ${w.message}`))

      const outcomeText = {
        deleted: 'fully deleted',
        deactivated: 'deactivated (local files removed)',
        removed: 'removed from Forge',
      }

      showToast({
        type: 'success',
        message: `Project "${projectName}" ${outcomeText[outcome]}`,
      })

      handleClose()
    } catch (error) {
      const ipcError = isSerializedError(error) ? error : serializeError(error)
      const message = ipcError.message || 'Failed to delete project'
      setGenericError(message)
      showToast({ type: 'error', message })
    } finally {
      setLoading(false)
    }
  }

  // Delete local files only (keep project in Forge as inactive)
  const handleDeleteLocalOnly = async () => {
    if (!projectId) return

    setLoading(true)
    setGenericError(null)

    try {
      const result = await deleteProject(projectId, {
        deleteFromGitHub: false,
        deleteLocalFiles: true,
      })

      if (!result.ok) {
        console.error('Failed to delete project:', result.error)
        const message = result.error.message || 'Failed to delete project'
        setGenericError(message)
        showToast({ type: 'error', message })
        return
      }

      showToast({
        type: 'success',
        message: `Project "${projectName}" is now inactive (local files removed)`,
      })

      handleClose()
    } catch (error) {
      const ipcError = isSerializedError(error) ? error : serializeError(error)
      const message = ipcError.message || 'Failed to delete project'
      setGenericError(message)
      showToast({ type: 'error', message })
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
        scopeError ? (
          // Show alternative options when GitHub deletion failed
          <>
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteLocalOnly}
              loading={loading}
            >
              Delete Local Files Only
            </Button>
          </>
        ) : (
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
              {primaryActionLabel}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        <p className="text-stone-700">
          Are you sure you want to delete <strong>{projectName}</strong>?
        </p>

        {!scopeError && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-stone-500 font-medium">
              Choose what you want to delete:
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
                    Permanently delete the repository from GitHub. This also deletes local files.
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
                disabled={loading || deleteFromGitHub}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
              />
              <label
                htmlFor="delete-local"
                className={`text-sm ${deleteFromGitHub ? 'text-stone-400' : 'text-stone-700'}`}
              >
                <span className="font-medium">Delete local files</span>
                <p className={`text-xs mt-0.5 ${deleteFromGitHub ? 'text-stone-400' : 'text-stone-500'}`}>
                  Remove the project folder from your computer.
                </p>
              </label>
            </div>
          </div>
        )}

        {scopeError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-2">
            <p className="text-sm text-red-800 font-medium">
              GitHub CLI needs additional permissions to delete repositories.
            </p>
            <p className="text-sm text-red-700">
              Run this command in your terminal:
            </p>
            <code className="block bg-red-100 px-2 py-1 rounded text-xs text-red-900 font-mono">
              {scopeCommand || 'gh auth refresh -h github.com -s delete_repo'}
            </code>
            <p className="text-xs text-red-600">
              Then try again. Or delete local files only to keep the project in Forge as inactive.
            </p>
          </div>
        )}

        {!scopeError && genericError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800">{genericError}</p>
          </div>
        )}

        {!scopeError && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm text-amber-800">
              {deleteFromGitHub || deleteLocalFiles ? (
                <>
                  {deleteFromGitHub ? (
                    <>
                      <strong>Warning:</strong> GitHub + local deletion is permanent and cannot be undone.
                    </>
                  ) : (
                    <>
                      Local files will be removed. The project will remain in Forge as <strong>Inactive</strong>.
                    </>
                  )}
                </>
              ) : (
                <>
                  This removes the project from Forge only. The project folder and GitHub repository will be preserved.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
