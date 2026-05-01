import { useState, useEffect, useCallback } from 'react'
import { Play, Loader2 } from 'lucide-react'
import TestTree from '@/components/TestTree'
import { Button } from '@/components/ui/button'
import { usePlanDetails } from './usePlanDetails'
import { useEscapeKey } from '@/lib/hooks/useEscapeKey'
import { confirm } from '@/lib/hooks/useConfirmDialog'
import type { Test, Action } from '@/types/plan'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

// New Layout Components
import { ActivityBar } from '@/components/layout/ActivityBar'
import { SidebarPanel } from '@/components/layout/SidebarPanel'
import { SessionManager } from '@/components/session/SessionManager'

// Extracted Plan Components
import { PlanDetailsHeader } from './components/PlanDetailsHeader'
import { TestEditorPanel } from './components/TestEditorPanel'
import { ActionEditorPanel } from './components/ActionEditorPanel'

interface PlanDetailsPageProps {
  filename: string;
  onNavigate?: (path: string) => void;
  onBack?: () => void;
}

export default function PlanDetailsPage({ filename, onNavigate, onBack }: PlanDetailsPageProps) {
  const {
    plan, loading, error, isDirty, saveStatus, logs, selectedItem, initializingTestId,
    setSelectedItem,
    loadPlan,
    handleSave,
    handleAddTest, handleAddAction,
    handleDeleteTest, handleDeleteAction,
    handleMoveTest, handleMoveAction,
    handleRunAll, handleRunTest, handleRunAction,
    updateSelectedItem,
    handleToggleEnabled,
    handleAddProfile, handleUpdateProfile, handleDeleteProfile,
    isRunning
  } = usePlanDetails(filename)

  const [activeView, setActiveView] = useState<"sessions" | "tests">("tests");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isNarrow = useMediaQuery("(max-width: 1024px)");

  useEffect(() => {
    if (isNarrow) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true); 
    }
  }, [isNarrow]);

  const handleToggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleViewChange = (view: "sessions" | "tests") => {
    if (view === activeView) {
      handleToggleSidebar();
    } else {
      setActiveView(view);
      setIsSidebarOpen(true);
    }
  };

  const handleBackNavigation = useCallback(async () => {
    if (isDirty) {
      const confirmed = await confirm({
        title: "Unsaved Changes",
        description: "You have unsaved changes. Are you sure you want to leave?",
        confirmText: "Leave",
        variant: "destructive"
      });
      if (!confirmed) return
    }
    if (onBack) {
      onBack()
    } else {
      onNavigate?.('dashboard')
    }
  }, [isDirty, onBack, onNavigate]);

  useEscapeKey(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  })

  const isTest = (item: unknown): item is Test => {
    if (!item || typeof item !== 'object') return false;
    return 'testID' in item && !('actionID' in item);
  }

  if (loading) return <div className="app-empty-state m-6 h-[calc(100%-3rem)]">Loading...</div>
  if (error) return <div className="app-empty-state m-6 h-[calc(100%-3rem)] text-destructive">{error}</div>

  return (
    <div className="app-shell relative h-full">
      <ActivityBar activeView={activeView} onViewChange={handleViewChange} />

      {(isSidebarOpen || !isNarrow) && (
        <div 
            className={`
                z-40 flex flex-col border-r border-border/80 bg-sidebar shadow-2xl transition-all duration-300 ease-in-out
                ${isNarrow 
                    ? `fixed left-12 top-0 bottom-0 w-80 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}` 
                    : `relative w-80 ${isSidebarOpen ? 'block' : 'hidden'}`
                }
            `}
            style={{
                display: !isNarrow && !isSidebarOpen ? 'none' : 'flex'
            }}
        >
        {activeView === "tests" ? (
          <SidebarPanel title="TEST EXPLORER">
               <TestTree
                  testPlan={plan.testPlan}
                  selectedItem={selectedItem}
                  onSelect={setSelectedItem}
                  onEdit={() => { }}
                  onAddTest={handleAddTest}
                  onAddAction={handleAddAction}
                  onMoveTest={handleMoveTest}
                  onMoveAction={handleMoveAction}
                  onDeleteTest={handleDeleteTest}
                  onDeleteAction={handleDeleteAction}
                  onRunTest={handleRunTest}
                  onRunAction={handleRunAction}
                  onToggleEnabled={handleToggleEnabled}
                  logs={logs}
                  initializingTestId={initializingTestId}
                />
          </SidebarPanel>
        ) : (
          <SessionManager 
              profiles={plan.profiles}
              onAdd={handleAddProfile}
              onUpdate={handleUpdateProfile}
              onDelete={handleDeleteProfile}
          />
        )}
      </div>
      )}

      {isNarrow && isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/55 backdrop-blur-[1px] transition-opacity duration-300 animate-in fade-in" 
          onClick={() => setIsSidebarOpen(false)} 
          style={{ left: '3rem' }}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col bg-background">
          <PlanDetailsHeader 
            title={plan.title}
            filename={filename}
            isDirty={isDirty}
            isRunning={isRunning}
            saveStatus={saveStatus}
            onBack={handleBackNavigation}
            onRunAll={handleRunAll}
            onReload={async () => { 
                if (!isDirty) {
                    loadPlan();
                    return;
                }
                const confirmed = await confirm({
                    title: "Discard Changes",
                    description: "Discard all unsaved changes and reload?",
                    confirmText: "Discard",
                    variant: "destructive"
                });
                if (confirmed) loadPlan();
            }}
            onSave={handleSave}
          />

          <main className="app-page flex-1">
              {!selectedItem ? (
                <div className="app-empty-state m-6 h-[calc(100%-3rem)] space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-border/80 bg-panelMuted">
                    <Play className="ml-1 h-8 w-8 text-muted-foreground" />
                  </div>
                  <p>Select a test or action to view details</p>
                </div>
              ) : (
                <div className="app-page-inner max-w-[1500px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex flex-col gap-4 border-b border-border/80 pb-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-1">
                      <div className="app-section-label">{isTest(selectedItem) ? 'Selected Test' : 'Selected Action'}</div>
                      <h2 className="mb-1 text-2xl font-bold">{isTest(selectedItem) ? 'Test Details' : 'Action Details'}</h2>
                      <p className="text-sm text-muted-foreground">
                        {isTest(selectedItem) ? 'Configure test properties' : 'Configure action behavior and parameters'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-success/40 text-success hover:bg-success/10 hover:text-success"
                      onClick={() => isTest(selectedItem) ? handleRunTest(selectedItem) : handleRunAction(selectedItem)}
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2 fill-current" /> Run {isTest(selectedItem) ? 'Test' : 'Action'}
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {isTest(selectedItem) ? (
                      <div className="app-surface space-y-5 p-6">
                        <TestEditorPanel 
                          test={selectedItem}
                          plan={plan}
                          onUpdate={updateSelectedItem}
                          onManageProfiles={() => {
                            setActiveView("sessions");
                            setIsSidebarOpen(true);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="app-surface space-y-5 p-6">
                        <ActionEditorPanel 
                          action={selectedItem}
                          onUpdate={updateSelectedItem as (updates: Partial<Action>) => void}
                          logs={logs}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
          </main>
      </div>
    </div>
  )
}
