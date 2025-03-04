import { createFileRoute } from '@tanstack/react-router'
import { MFAView } from 'modules'

export const Route = createFileRoute('/login/mfa')({
  component: MFAView,
})
