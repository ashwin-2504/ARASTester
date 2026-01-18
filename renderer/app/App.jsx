import React, { useState } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import AppShell from '../layouts/AppShell'

// Lazy load views
const DashboardPage = React.lazy(() => import('../routes/Dashboard/DashboardPage'))
const PlanDetailsPage = React.lazy(() => import('../routes/PlanDetails/PlanDetailsPage'))
const Settings = React.lazy(() => import('../components/Settings'))

import { actionRegistry } from '../core/registries/ActionRegistry'

// NOTE: Actions are now loaded from action-schemas.json in the ActionRegistry constructor.
// Domain action plugins (domains/aras/actions, domains/core/actions) are deprecated.
// The schema provides: type, label, apiEndpoint, apiMethod, fields, and generates Editors dynamically.

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

// Wrapper to bridge Route params to PlanDetailsPage props
function PlanWrapper() {
  const { filename } = useParams()
  const navigate = useNavigate()

  return (
    <PlanDetailsPage
      filename={decodeURIComponent(filename)}
      onNavigate={(target) => {
        if (target === 'dashboard') navigate('/')
      }}
      onBack={() => navigate('/')}
    />
  )
}
