import React, { useState, useEffect } from 'react'
import Layout from './components/Layout'
// Lazy load views
const Dashboard = React.lazy(() => import('./components/Dashboard'))
const PlanDetails = React.lazy(() => import('./components/PlanDetails'))
const Settings = React.lazy(() => import('./components/Settings'))

import { actionRegistry } from './registries/ActionRegistry'
import { viewRegistry } from './registries/ViewRegistry'
import { ClickAction, TypeAction, WaitAction, VerifyAction } from './plugins/actions/CoreActions'
import { CustomAction } from './plugins/actions/CustomAction'

// Register core actions
actionRegistry.register(ClickAction)
actionRegistry.register(TypeAction)
actionRegistry.register(WaitAction)
actionRegistry.register(VerifyAction)
actionRegistry.register(CustomAction)

// Register Views
viewRegistry.register({
  id: 'dashboard',
  Component: Dashboard,
  isDefault: true
})

viewRegistry.register({
  id: 'plan',
  Component: PlanDetails
})

viewRegistry.register({
  id: 'settings',
  Component: Settings
})

export default function App() {
  const [route, setRoute] = useState(viewRegistry.getDefault())
  const [params, setParams] = useState(null)

  const navigate = (target, p) => {
    setRoute(target)
    setParams(p)
  }

  const view = viewRegistry.get(route)
  let content

  if (view) {
    const ViewComponent = view.Component
    // Pass common props. Specific views might ignore some.
    content = <ViewComponent onNavigate={navigate} filename={params} onBack={() => navigate('dashboard')} />
  } else {
    content = <div>Not Found</div>
  }

  return (
    <Layout>
      <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
        {content}
      </React.Suspense>
    </Layout>
  )
}
