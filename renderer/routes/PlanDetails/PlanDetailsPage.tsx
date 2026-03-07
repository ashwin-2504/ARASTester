import React, { useState, useEffect, useCallback } from 'react'
import { Play, Loader2 } from 'lucide-react'
import TestTree from '@/components/TestTree'
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

  if (loading) return <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
  if (error) return <div className="flex h-full items-center justify-center text-red-500">{error}</div>

  return (
    <div className="flex h-full bg-background relative">
      <ActivityBar activeView={activeView} onViewChange={handleViewChange} />

      {(isSidebarOpen || !isNarrow) && (
        <div 
            className={`
                bg-zinc-950 border-r border-zinc-800 flex flex-col transition-all duration-300 ease-in-out shadow-2xl z-40
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
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 animate-in fade-in" 
          onClick={() => setIsSidebarOpen(false)} 
          style={{ left: '3rem' }}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-background">
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

          <main className="flex-1 overflow-y-auto p-4">
              {!selectedItem ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center">
                    <Play className="h-8 w-8 text-zinc-700 ml-1" />
                  </div>
                  <p>Select a test or action to view details</p>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-end justify-between border-b pb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{isTest(selectedItem) ? 'Test Details' : 'Action Details'}</h2>
                      <p className="text-sm text-muted-foreground">
                        {isTest(selectedItem) ? 'Configure test properties' : 'Configure action behavior and parameters'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="text-emerald-500 border-emerald-500 hover:bg-emerald-500/10"
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
                      <TestEditorPanel 
                        test={selectedItem}
                        plan={plan}
                        onUpdate={updateSelectedItem}
                        onManageProfiles={() => {
                          setActiveView("sessions");
                          setIsSidebarOpen(true);
                        }}
                      />
                    ) : (
                      <ActionEditorPanel 
                        action={selectedItem as Action}
                        onUpdate={updateSelectedItem as (updates: Partial<Action>) => void}
                        logs={logs}
                      />
                    )}
                  </div>
                </div>
              )}
          </main>
      </div>
    </div>
  )
}

// Local Button component to resolve UI dependency mapping
import { cn } from "@/lib/utils"

const Button = React.forwardRef<HTMLButtonElement, any>(
  ({ className, variant, size, ...props }, ref) => {
    const variants: any = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 m-1",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground m-1",
      ghost: "hover:bg-accent hover:text-accent-foreground m-1",
    }
    const sizes: any = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    }
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant || 'default'],
          sizes[size || 'default'],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
