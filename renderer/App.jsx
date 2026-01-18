import React, { useState } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import AppShell from './layouts/AppShell'

// Lazy load views
const DashboardPage = React.lazy(() => import('./routes/Dashboard/DashboardPage'))
const PlanDetails = React.lazy(() => import('./components/PlanDetails'))
const Settings = React.lazy(() => import('./components/Settings'))

import { actionRegistry } from './registries/ActionRegistry'

// Import actions from domains (PRESERVED)
import * as ArasActions from './domains/aras/actions'
import * as CoreActions from './domains/core/actions'

// Register all actions (Side-effect on load)
Object.values(ArasActions).forEach(action => actionRegistry.register(action))
Object.values(CoreActions).forEach(action => actionRegistry.register(action))

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <Router>
      <AppShell>
        <React.Suspense fallback={<div className="flex h-full items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<DashboardPage onOpenSettings={() => setIsSettingsOpen(true)} />} />
            <Route path="/plan/:filename" element={<PlanWrapper />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>

        {/* Settings Modal Overlay */}
        {isSettingsOpen && (
          <React.Suspense fallback={null}>
            <Settings onClose={() => setIsSettingsOpen(false)} />
          </React.Suspense>
        )}
      </AppShell>
    </Router>
  )
}

// Wrapper to bridge Route params to old PlanDetails props
function PlanWrapper() {
  const { filename } = useParams()
  const navigate = useNavigate()

  return (
    <PlanDetails
      filename={decodeURIComponent(filename)}
      onNavigate={(target) => {
        if (target === 'dashboard') navigate('/')
      }}
      onBack={() => navigate('/')}
    />
  )
}
