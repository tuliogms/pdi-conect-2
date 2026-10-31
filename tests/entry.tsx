import React from 'react'
import { createRoot } from 'react-dom/client'
import DashboardApp from '@/app/dashboard/dashboard-app'

export async function montar(perfil: string, container: HTMLElement) {
  const root = createRoot(container)
  root.render(React.createElement(DashboardApp, { perfilInicial: perfil as never }))
  return root
}
