import React from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'

interface AppShellProps {
  children?: React.ReactNode;
}

export default function AppShell(_props: AppShellProps) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar - Placeholder for potential future restoration */}
      <aside className="w-16 flex flex-col items-center py-4 bg-[#1c1c1f] border-r border-zinc-800 hidden">
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content Area */}
          <Outlet />
      </div>
      <Toaster />
    </div>
  )
}
