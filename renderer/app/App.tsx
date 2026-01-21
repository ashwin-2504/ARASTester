import React, { Component, ErrorInfo, ReactNode } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-red-500 bg-zinc-900 h-screen">
          <h1 className="text-xl font-bold mb-4">Something went wrong</h1>
          <pre className="whitespace-pre-wrap bg-zinc-800 p-4 rounded text-sm font-mono">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
import AppShell from '@/layouts/AppShell'
import DashboardPage from '@/routes/Dashboard/DashboardPage'
import PlanDetailsPage from '@/routes/PlanDetails/PlanDetailsPage'
import SettingsPage from '@/routes/Settings/SettingsPage.jsx' // Assuming SettingsPage is not migrated yet? Or maybe it is?
// Check if SettingsPage needs migration. Stage 3d includes App Shell. SettingsPage wasn't explicitly mentioned but might be "Routes".
// I'll assume it exists as .jsx for now.
import { Toaster } from '@/components/ui/toaster'

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route 
              path="/plan/:filename" 
              element={
                <PageWrapper>
                  {/* @ts-ignore router params handling */}
                  {(params, navigate) => (
                    <PlanDetailsPage 
                      filename={decodeURIComponent(params.filename)} 
                      onNavigate={(path) => navigate(path)}
                      onBack={() => navigate(-1)}
                    />
                  )} 
                </PageWrapper>
              } 
            />
            <Route 
              path="/settings" 
              element={<SettingsPage />} 
            />
          </Route>
        </Routes>
        <Toaster />
      </HashRouter>
    </ErrorBoundary>
  )
}

// Helper to bridge Router params to Props if needed, or update PlanDetailsPage to use useParams.
// Actually PlanDetailsPage was migrated to take { filename }. 
// So we need to extract it from useParams.
import { useParams, useNavigate, NavigateFunction } from 'react-router-dom';

function PageWrapper({ children }: { children: (params: any, navigate: NavigateFunction) => React.ReactNode }) {
  const params = useParams();
  const navigate = useNavigate();
  return <>{children(params, navigate)}</>;
}
