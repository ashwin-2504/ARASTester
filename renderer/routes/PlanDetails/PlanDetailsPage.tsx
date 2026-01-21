import React from 'react'
import { ChevronLeft, RotateCcw, Save, Play, ChevronDown, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import TestTree from '@/components/TestTree'
// @ts-ignore
import JsonViewer from '@/components/JsonViewer.jsx'
import { usePlanDetails } from './usePlanDetails'
import { actionRegistry } from '@/core/registries/ActionRegistry'
import actionSchemas from '@/core/schemas/action-schemas.json'
import { useEscapeKey } from '@/lib/hooks/useEscapeKey'
import type { Test, Action } from '@/types/plan'

interface PlanDetailsPageProps {
  filename: string;
  onNavigate?: (path: string) => void;
  onBack?: () => void;
}

export default function PlanDetailsPage({ filename, onNavigate, onBack }: PlanDetailsPageProps) {
  const {
    plan, loading, error, isDirty, saveStatus, logs, selectedItem,
    setSelectedItem,
    loadPlan,
    handleSave,
    handleAddTest, handleAddAction,
    handleDeleteTest, handleDeleteAction,
    handleMoveTest, handleMoveAction,
    handleRunAll, handleRunTest, handleRunAction,
    updateSelectedItem,
    handleToggleEnabled
  } = usePlanDetails(filename)

  // Handle back navigation
  const handleBackNavigation = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) return
    }
    onBack?.() || onNavigate?.('dashboard')
  }

  useEscapeKey(() => {
    // Optional: Deselect item on escape? Or maybe just do nothing
    // setSelectedItem(null) 
  })

  // Helper to determine if selected item is a test
  const isTest = (item: any): item is Test => item?.hasOwnProperty('testID') && !item.hasOwnProperty('actionID')

  if (loading) return <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
  if (error) return <div className="flex h-full items-center justify-center text-red-500">{error}</div>

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex-none h-16 border-b px-6 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackNavigation}
            className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">{plan.title || filename}</h1>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus && <span className="text-sm text-emerald-500 font-medium">{saveStatus}</span>}
          <Button
            variant="outline"
            className="text-emerald-500 border-emerald-500 hover:bg-emerald-500/10"
            onClick={handleRunAll}
          >
            <Play className="h-4 w-4 mr-2 fill-current" /> Run All
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { if (!isDirty || confirm("Discard changes?")) loadPlan() }}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button onClick={handleSave} disabled={!isDirty}>
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Test Tree */}
        <aside className="w-1/3 max-w-sm flex flex-col border-r bg-card">
          <ScrollArea className="flex-1 p-0">
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
            />
          </ScrollArea>
        </aside>

        {/* Right Panel - Details */}
        <section className="flex-1 overflow-y-auto bg-background p-6 lg:p-10">
          {!selectedItem ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Select a test or action to view details</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Panel Header */}
              <div className="flex items-end justify-between border-b pb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{isTest(selectedItem) ? 'Test Details' : 'Action Details'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {isTest(selectedItem) ? 'Configure test properties' : 'Configure action behavior and parameters'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="text-emerald-500 border-emerald-500 hover:bg-emerald-500/10"
                  onClick={() => isTest(selectedItem) ? handleRunTest(selectedItem as Test) : handleRunAction(selectedItem as Action)}
                >
                  <Play className="h-4 w-4 mr-2 fill-current" /> Run {isTest(selectedItem) ? 'Test' : 'Action'}
                </Button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {isTest(selectedItem) ? (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Test Title</label>
                      <Input
                        value={(selectedItem as Test).testTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSelectedItem({ testTitle: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="testEnabled"
                        checked={(selectedItem as Test).isEnabled !== false}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSelectedItem({ isEnabled: e.target.checked })}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <label htmlFor="testEnabled" className="text-sm font-medium">Enabled</label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Action Title</label>
                      <Input
                        value={(selectedItem as Action).actionTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSelectedItem({ actionTitle: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Action Type</label>
                      <div className="flex gap-3">
                        {/* Action Type Selector Logic needs to be robust */}
                        {/* Custom Dropdown Selectors */}
                        {(() => {
                          const currentCatId = actionSchemas.actions.find(a => a.type === (selectedItem as Action).actionType)?.category || actionSchemas.categories[0].id
                          const currentCategory = actionSchemas.categories.find(c => c.id === currentCatId) || actionSchemas.categories[0]
                          const currentAction = actionSchemas.actions.find(a => a.type === (selectedItem as Action).actionType)

                          return (
                            <>
                              {/* Category Dropdown */}
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

                              {/* Action Type Dropdown */}
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
                                            {(selectedItem as Action).actionType === a.type && <Check className="ml-auto h-4 w-4" />}
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
                      const plugin = actionRegistry.get((selectedItem as Action).actionType)
                      if (plugin?.Editor) {
                        const Editor = plugin.Editor
                        return (
                          <div className="mt-6 rounded-lg border bg-muted/20 p-5 space-y-5">
                            <Editor
                              params={(selectedItem as Action).params || {}}
                              onChange={(newParams: any) => updateSelectedItem({ params: newParams })}
                            />
                          </div>
                        )
                      }
                      return null
                    })()}
                  </>
                )}

                {/* Execution Log */}
                {!isTest(selectedItem) && (selectedItem as Action).actionID && logs[(selectedItem as Action).actionID] && (
                  <div className="pt-6 border-t mt-6">
                    <h3 className="text-sm font-semibold mb-3">Execution Log</h3>
                    <div className="bg-muted/30 p-4 rounded-md text-sm font-mono">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${logs[(selectedItem as Action).actionID].status === 'Success' ? 'bg-emerald-500/20 text-emerald-500' :
                          ['Failed', 'Error'].includes(logs[(selectedItem as Action).actionID].status) ? 'bg-red-500/20 text-red-500' :
                            'bg-blue-500/20 text-blue-500'
                          }`}>
                          {logs[(selectedItem as Action).actionID].status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(() => {
                            const d = new Date(logs[(selectedItem as Action).actionID].timestamp)
                            return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()} ${d.toLocaleTimeString()}`
                          })()}
                        </span>
                      </div>
                      <JsonViewer data={logs[(selectedItem as Action).actionID].details} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
