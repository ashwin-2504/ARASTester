import React, { useState } from 'react'
import { ChevronLeft, RotateCcw, Save, Play, ChevronDown, Check, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import TestTree from '@/components/TestTree'
import JsonViewer from '@/components/JsonViewer'
import { usePlanDetails } from './usePlanDetails'
import { actionRegistry } from '@/core/registries/ActionRegistry'
import actionSchemas from '@/core/schemas/action-schemas.json'
import { useEscapeKey } from '@/lib/hooks/useEscapeKey'
import type { Test } from '@/types/plan'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

// New Layout Components
import { ActivityBar } from '@/components/layout/ActivityBar'
import { SidebarPanel } from '@/components/layout/SidebarPanel'
import { SessionManager } from '@/components/session/SessionManager'
import { Database } from 'lucide-react'

interface PlanDetailsPageProps {
  filename: string;
  onNavigate?: (path: string) => void;
  onBack?: () => void;
}

// Buffered Input Component
const BufferedInput = ({ value, onChange, ...props }: React.ComponentProps<typeof Input>) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value when external value changes (e.g. navigation)
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <Input
      {...props}
      value={localValue}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalValue(e.target.value)}
      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
        if (localValue !== value) {
          onChange?.({ ...e, target: { ...e.target, value: localValue } } as React.ChangeEvent<HTMLInputElement>);
        }
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
        props.onKeyDown?.(e);
      }}
    />
  );
};

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

  // Contract: Focus-based auto-hide applies ONLY in Overlay (narrow) mode.
  // Contract: Resize -> Secondary panel hides (isNarrow overrides user preference)
  React.useEffect(() => {
    if (isNarrow) {
      setIsSidebarOpen(false);
    } else {
        // Optional: Auto-open on wide? Contract says "Wide > Closed > No action", but usually we want it open.
        // Adhering strictly to: "Wide > Open > No action" is preserved manually.
        // Let's stick to: "Resize to narrow -> Close".
        // Resize to wide -> Maintain state (or defaulting to open could be nice, but not strictly required).
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

  // Handle back navigation
  const handleBackNavigation = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) return
    }
    if (onBack) {
      onBack()
    } else {
      onNavigate?.('dashboard')
    }
  }

  useEscapeKey(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  })

  // Helper to determine if selected item is a test
  const isTest = (item: unknown): item is Test => {
    if (!item || typeof item !== 'object') return false;
    return 'testID' in item && !('actionID' in item);
  }

  if (loading) return <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
  if (error) return <div className="flex h-full items-center justify-center text-red-500">{error}</div>

  return (
    <div className="flex h-full bg-background relative">
      {/* 1. Activity Bar (Far Left) */}
      <ActivityBar activeView={activeView} onViewChange={handleViewChange} />

      {/* Fixed Sidebar Drawer (Overlay Mode) OR Docked Panel (Docked Mode) */}
      {/* 
          Docked Mode (!isNarrow):
          - Render ONLY if isSidebarOpen (no ghost panel)
          - Relative positioning to push content
          
          Overlay Mode (isNarrow):
          - Always render if isSidebarOpen (Fixed on top)
          - Hidden if !isSidebarOpen
      */}
      {(isSidebarOpen || !isNarrow) && (
        <div 
            className={`
                bg-zinc-950 border-r border-zinc-800 flex flex-col transition-all duration-300 ease-in-out shadow-2xl z-40
                ${isNarrow 
                    ? `fixed left-12 top-0 bottom-0 w-80 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}` 
                    : `relative w-80 ${isSidebarOpen ? 'block' : 'hidden'}` // Using hidden/block for docked toggling to avoid re-mounting if desired, OR conditional rendering.
                }
            `}
            // For Docked mode, we want conditional rendering to avoid layout taking space.
            // If !isSidebarOpen && !isNarrow, we want w-0 or display:none.
            // The cleanest way per plan: "Render the component only when isSidebarOpen is true in Docked mode".
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

      {/* Backdrop - Only in Overlay Mode when Open */}
      {isNarrow && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 animate-in fade-in" 
          onClick={() => setIsSidebarOpen(false)} 
          style={{ left: '3rem' }}
        />
      )}

      {/* 3. Main Content (Right) */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
          {/* Header */}
          {/* Header */}
          <header className="flex-none h-auto min-h-[4rem] border-b px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center justify-between bg-card/50 min-w-0">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <button
                onClick={handleBackNavigation}
                className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold tracking-tight truncate" title={plan.title || filename}>
                {plan.title || filename}
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap whitespace-nowrap">
              {saveStatus && <span className="text-sm text-emerald-500 font-medium whitespace-nowrap">{saveStatus}</span>}
              <Button
                variant="outline"
                className="text-emerald-500 border-emerald-500 hover:bg-emerald-500/10 whitespace-nowrap"
                onClick={handleRunAll}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2 fill-current" /> Run All
                  </>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { if (!isDirty || confirm("Discard changes?")) loadPlan() }} className="flex-shrink-0">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button onClick={handleSave} disabled={!isDirty} className="flex-shrink-0">
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
            </div>
          </header>

          {/* Details Content */}
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
                  {/* Panel Header */}
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

                  {/* Form */}
                  <div className="space-y-4">
                    {isTest(selectedItem) ? (
                      <>
						<div className="space-y-1.5">
                          <label className="block text-sm font-medium">Test Title</label>
                          <BufferedInput
                            value={(selectedItem).testTitle}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSelectedItem({ testTitle: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                           <label className="block text-sm font-medium">Session Profile</label>
                           <div className="flex gap-2">
                               {/* Replaced native select with DropdownMenu for better control */}
                               <div className="flex-1 relative">
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                            <span className="truncate">
                                                {(() => {
                                                    const pid = (selectedItem).sessionProfileId;
                                                    if (!pid) return "Default (Active Session)";
                                                    const p = plan.profiles?.find(p => p.id === pid);
                                                    return p ? p.name : "Unknown Profile";
                                                })()}
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="min-w-[200px] w-[var(--radix-dropdown-menu-trigger-width)]" align="start">
                                        <DropdownMenuItem 
                                            onSelect={() => updateSelectedItem({ sessionProfileId: undefined })}
                                            className="cursor-pointer"
                                        >
                                            Default (Active Session)
                                            {!(selectedItem).sessionProfileId && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        {plan.profiles?.map(p => (
                                            <DropdownMenuItem 
                                                key={p.id} 
                                                onSelect={() => updateSelectedItem({ sessionProfileId: p.id })}
                                                className="cursor-pointer"
                                            >
                                                {p.name}
                                                {(selectedItem).sessionProfileId === p.id && <Check className="ml-auto h-4 w-4" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                 </DropdownMenu>
                               </div>
                               <Button 
                                    variant="outline" 
                                    size="icon" 
                                    title="Manage Profiles"
                                    onClick={() => {
                                         setActiveView("sessions");
                                         setIsSidebarOpen(true);
                                    }}
                               >
                                    <Database className="h-4 w-4" />
                               </Button>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="testEnabled"
                            checked={(selectedItem).isEnabled !== false}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSelectedItem({ isEnabled: e.target.checked })}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                          />
                          <label htmlFor="testEnabled" className="text-sm font-medium">Enabled</label>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium">Action Title</label>
                          <BufferedInput
                            value={(selectedItem).actionTitle}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSelectedItem({ actionTitle: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium">Action Type</label>
                          <div className="flex gap-3">
                            {/* Category Dropdown */}
                            {(() => {
                              const currentCatId = actionSchemas.actions.find(a => a.type === (selectedItem).actionType)?.category || actionSchemas.categories[0].id
                              const currentCategory = actionSchemas.categories.find(c => c.id === currentCatId) || actionSchemas.categories[0]
                              const currentAction = actionSchemas.actions.find(a => a.type === (selectedItem).actionType)

                              return (
                                <>
                                  <div className="flex-1 relative">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="w-full flex items-center justify-between rounded-md border border-input bg-background/50 hover:bg-accent/50 hover:text-accent-foreground px-4 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
                                          <span className="flex items-center gap-2 truncate">
                                            <span>{currentCategory.icon}</span>
                                            <span>{currentCategory.label}</span>
                                          </span>
                                          <ChevronDown className="h-4 w-4 opacity-50" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-[300px]" align="start">
                                        {actionSchemas.categories.map(c => (
                                          <DropdownMenuItem
                                            key={c.id}
                                            onSelect={() => {
                                              const firstAction = actionSchemas.actions.find(a => a.category === c.id)
                                              if (firstAction) {
                                                const plugin = actionRegistry.get(firstAction.type)
                                                updateSelectedItem({
                                                  actionType: firstAction.type,
                                                  params: plugin ? JSON.parse(JSON.stringify(plugin.defaultParams)) : {}
                                                })
                                              }
                                            }}
                                            className="flex items-center gap-2"
                                          >
                                            <span className="text-muted-foreground">{c.icon}</span>
                                            {c.label}
                                            {currentCatId === c.id && <Check className="ml-auto h-4 w-4" />}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  <div className="flex-1 relative">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="w-full flex items-center justify-between rounded-md border border-input bg-background/50 hover:bg-accent/50 hover:text-accent-foreground px-4 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
                                          <span className="truncate">{currentAction?.label || "Select Action"}</span>
                                          <ChevronDown className="h-4 w-4 opacity-50" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-[300px]" align="start">
                                        <ScrollArea className="h-auto max-h-[300px]">
                                          {actionSchemas.actions
                                            .filter(a => a.category === currentCatId)
                                            .map(a => (
                                              <DropdownMenuItem
                                                key={a.type}
                                                onSelect={() => {
                                                  const plugin = actionRegistry.get(a.type)
                                                  updateSelectedItem({
                                                    actionType: a.type,
                                                    params: plugin ? JSON.parse(JSON.stringify(plugin.defaultParams)) : {}
                                                  })
                                                }}
                                              >
                                                {a.label}
                                                {(selectedItem).actionType === a.type && <Check className="ml-auto h-4 w-4" />}
                                              </DropdownMenuItem>
                                            ))}
                                        </ScrollArea>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        </div>

                        {/* Dynamic Action Editor */}
                        {(() => {
                          const plugin = actionRegistry.get((selectedItem).actionType)
                          if (plugin?.Editor) {
                            const Editor = plugin.Editor
                            return (
                              <div className="mt-4 rounded-lg border bg-muted/20 p-4 space-y-4">
                                <Editor
                                  params={(selectedItem).params || {}}
                                  onChange={(newParams: Record<string, unknown>) => updateSelectedItem({ params: newParams })}
                                />
                              </div>
                            )
                          }
                          return null
                        })()}
                      </>
                    )}

                    {/* Execution Log */}
                    {!isTest(selectedItem) && (selectedItem).actionID && logs[(selectedItem).actionID] && (
                      <div className="pt-6 border-t mt-6">
                        <h3 className="text-sm font-semibold mb-3">Execution Log</h3>
                        <div className="bg-muted/30 p-4 rounded-md text-sm font-mono">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${logs[(selectedItem).actionID].status === 'Success' ? 'bg-emerald-500/20 text-emerald-500' :
                              ['Failed', 'Error'].includes(logs[(selectedItem).actionID].status) ? 'bg-red-500/20 text-red-500' :
                                'bg-blue-500/20 text-blue-500'
                              }`}>
                              {logs[(selectedItem).actionID].status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {(() => {
                                const d = new Date(logs[(selectedItem).actionID].timestamp)
                                return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()} ${d.toLocaleTimeString()}`
                              })()}
                            </span>
                          </div>
                          <JsonViewer data={logs[(selectedItem).actionID].details} />
                        </div>
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
