import React from 'react'
import { Outlet } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface AppShellProps {
  children?: React.ReactNode;
}

export default function AppShell(_props: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="hidden">
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
      </div>
      <ConfirmDialog />
    </div>
  )
}
