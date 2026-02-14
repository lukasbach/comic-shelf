import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: RedirectComponent,
})

function RedirectComponent() {
  const navigate = useNavigate()
  
  useEffect(() => {
    navigate({ to: '/library', replace: true })
  }, [navigate])

  return null
}
