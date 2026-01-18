import React from 'react'

/**
 * AppShell - Minimal structural frame.
 * No sidebar. Just a simple container for the main content.
 * Settings is handled as a modal overlay, not a route.
 */
export default function AppShell({ children }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col">
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
