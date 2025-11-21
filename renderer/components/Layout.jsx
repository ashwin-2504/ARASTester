import React from 'react'

export default function Layout({ children }) {
  return (
    <div className="h-screen w-screen bg-background font-sans antialiased flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col min-h-0">
        {children}
      </main>
    </div>
  )
}
