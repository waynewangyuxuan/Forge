/**
 * ReviewHeader
 * Top bar for the Review page with title and optional actions.
 * Wrapper around PageHeader with Review-specific defaults.
 */

import React from 'react'
import { PageHeader } from '../layout'

export interface ReviewHeaderProps {
  title?: string
  actions?: React.ReactNode
}

export const ReviewHeader: React.FC<ReviewHeaderProps> = ({
  title = 'Review',
  actions,
}) => {
  return <PageHeader title={title} actions={actions} />
}

ReviewHeader.displayName = 'ReviewHeader'
