import React, { useState, useEffect } from 'react'
import { ChevronLeft, RotateCcw, Save, X, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import TestTree from './TestTree'
import TestPlanService from '../services/TestPlanService'
import { arrayMove } from '@dnd-kit/sortable'
import { actionRegistry } from '../registries/ActionRegistry'

export default function PlanDetails({ filename, onNavigate }) {
  const [plan, setPlan] = useState({ testPlan: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const [logs, setLogs] = useState({})
  const [saveStatus, setSaveStatus] = useState('')

  // ... (loadPlan, handleSave, etc.)

  // ... (ensureIds, loadPlan implementation ...)

  // Make sure ensureIds is preserved or just insert the state at the top
  // I will assume the user wants me to merge this carefully.
  // Actually, I'll use multi_replace to insert the state and then the other parts.
  // But wait, replace_file_content is for contiguous blocks.
  // I should probably use multi_replace for this file as I need to touch multiple places.
  // Converting to multi_replace...




  // Note: We need to handle action reordering. 
  // Since TestTree handles the drag event, it needs to pass enough info.
  // But wait, TestTree's handleDragEnd logic was:
  // if (isTest) onReorderTests(...)
  // else ...

  // We need to ensure TestTree passes the right IDs.
  // For actions, we need to know WHICH test they belong to.
  // Let's assume TestTree passes (testId, activeActionId, overActionId) or similar?
  // Actually, my TestTree implementation of handleDragEnd was incomplete for actions.
  // "Let's assume onReorder prop that takes (activeId, overId)."

  // I need to update PlanDetails to handle the reordering based on IDs.
  // Since I don't have unique Action IDs globally (only locally generated in TestTree if missing),
  // this is tricky.
  // Ideally, I should generate Action IDs when loading the plan if they are missing.

  // Let's add a helper to ensure IDs exist on load.

  const ensureIds = (data) => {
    if (!data.testPlan) return data
    data.testPlan.forEach(t => {
      if (!t.testID) t.testID = `T${Math.random().toString(36).substr(2, 9)}`
      if (t.testActions) {
        t.testActions.forEach((a, i) => {
          if (!a.actionID) a.actionID = `A${Math.random().toString(36).substr(2, 9)}`
        })
      }
    })
    return data
  }

  const loadPlan = async () => {
    try {
      setLoading(true)
      const data = await TestPlanService.getPlan(filename)
      const withIds = ensureIds(data)
      setPlan(withIds)
      setIsDirty(false)
      setError(null)
      setSelectedItem(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlan()
  }, [filename])

  const handleSave = async () => {
    try {
      await TestPlanService.updatePlan(filename, plan)
      setIsDirty(false)
      setSaveStatus('Saved!')
      setTimeout(() => setSaveStatus(''), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBack = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) return
    }
    onNavigate('dashboard')
  }

  const handleRefresh = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to discard them?')) return
    }
    loadPlan()
  }


  const handleTitleChange = (e) => {
    setPlan({ ...plan, title: e.target.value })
    setIsDirty(true)
  }

  const handleReorderTests = (activeId, overId) => {
    setPlan((prevPlan) => {
      const oldIndex = prevPlan.testPlan.findIndex((t) => t.testID === activeId)
      const newIndex = prevPlan.testPlan.findIndex((t) => t.testID === overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newTestPlan = arrayMove(prevPlan.testPlan, oldIndex, newIndex)
        return { ...prevPlan, testPlan: newTestPlan }
      }
      return prevPlan
    })
    setIsDirty(true)
  }

  const handleReorderActions = (activeId, overId) => {
    setPlan((prevPlan) => {
      const newPlan = { ...prevPlan }
      // Find test with the active action
      const test = newPlan.testPlan.find(t => t.testActions && t.testActions.find(a => a.actionID === activeId))

      if (test) {
        const oldIndex = test.testActions.findIndex(a => a.actionID === activeId)
        const newIndex = test.testActions.findIndex(a => a.actionID === overId)

        if (oldIndex !== -1 && newIndex !== -1) {
          test.testActions = arrayMove(test.testActions, oldIndex, newIndex)
          return newPlan
        }
      }
      return prevPlan
    })
    setIsDirty(true)
  }

  const handleDeleteTest = (testId) => {
    if (!confirm("Are you sure you want to delete this test and all its actions?")) return
    setPlan((prevPlan) => ({
      ...prevPlan,
      testPlan: prevPlan.testPlan.filter(t => t.testID !== testId)
    }))
    setSelectedItem(null)
    setIsDirty(true)
  }

  const handleDeleteAction = (actionId) => {
    if (!confirm("Are you sure you want to delete this action?")) return
    setPlan((prevPlan) => {
      const newPlan = { ...prevPlan }
      newPlan.testPlan.forEach(t => {
        if (t.testActions) {
          t.testActions = t.testActions.filter(a => a.actionID !== actionId)
        }
      })
      return newPlan
    })
    setSelectedItem(null)
    setIsDirty(true)
  }

  // ... (handleAddTest, handleAddAction)

  const handleAddTest = () => {
    const newTest = {
      testTitle: "New Test",
      testID: `T${Date.now()}`,
      isEnabled: true,
      testActions: []
    }
    const newPlan = { ...plan }
    if (!newPlan.testPlan) newPlan.testPlan = []
    newPlan.testPlan.push(newTest)
    setPlan(newPlan)
    setIsDirty(true)
    setSelectedItem(newTest)
  }

  const handleAddAction = (test) => {
    const newAction = {
      actionTitle: "New Action",
      actionType: "Click",
      actionID: `A${Date.now()}`,
      isEnabled: true,
      params: actionRegistry.get("Click") ? JSON.parse(JSON.stringify(actionRegistry.get("Click").defaultParams)) : {}
    }
    if (!test.testActions) test.testActions = []
    test.testActions.push(newAction)
    setPlan({ ...plan })
    setIsDirty(true)
    setSelectedItem(newAction)
  }

  // === Run Handlers ===
  const handleRunAll = async () => {
    console.log('🚀 Running all tests in plan:', plan.title)
    for (const test of plan.testPlan || []) {
      if (test.isEnabled !== false) {
        await handleRunTest(test)
      }
    }
    console.log('✅ All tests completed')
  }

  const handleRunTest = async (test) => {
    console.log(`▶️ Running test: ${test.testTitle}`)
    for (const action of test.testActions || []) {
      if (action.isEnabled !== false) {
        await handleRunAction(action)
      }
    }
    console.log(`✓ Test completed: ${test.testTitle}`)
  }

  const handleRunAction = async (action) => {
    console.log(`  ⚡ Running action: ${action.actionTitle} (${action.actionType})`, action.params)

    // Create Log Entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      status: 'Running...',
      details: null
    }
    setLogs(prev => ({ ...prev, [action.actionID]: logEntry }))

    try {
      if (action.actionType === 'ArasConnect') {
        const payload = { ...action.params }
        // Apply defaults if empty
        if (!payload.url) payload.url = 'http://localhost/InnovatorServer/Server/InnovatorServer.aspx'
        if (!payload.database) payload.database = 'InnovatorSolutions'
        if (!payload.username) payload.username = 'admin' // basic default

        const response = await fetch('http://localhost:5000/api/aras/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await response.json()

        setLogs(prev => ({
          ...prev,
          [action.actionID]: {
            timestamp: new Date().toISOString(),
            status: data.success ? 'Success' : 'Failed',
            details: data
          }
        }))

        if (!data.success) {
          console.error('Action failed:', data.message)
        }
      } else {
        // Simulate other actions
        await new Promise(resolve => setTimeout(resolve, 500))
        setLogs(prev => ({
          ...prev,
          [action.actionID]: {
            timestamp: new Date().toISOString(),
            status: 'Completed',
            details: { message: 'Action simulation completed' }
          }
        }))
      }
    } catch (error) {
      setLogs(prev => ({
        ...prev,
        [action.actionID]: {
          timestamp: new Date().toISOString(),
          status: 'Error',
          details: { message: error.message }
        }
      }))
    }

    console.log(`  ✓ Action completed: ${action.actionTitle}`)
  }

  const renderRightPanel = () => {
    if (!selectedItem) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-lg font-medium">Select a test or action to view details</p>
        </div>
      )
    }

    const isTest = selectedItem.hasOwnProperty('testID')

    return (
      <div className="h-full flex flex-col p-6">
        <div className="mb-6 pb-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {isTest ? 'Test Details' : 'Action Details'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isTest ? 'Configure test properties.' : 'Configure action behavior.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-emerald-500 border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
            onClick={() => isTest ? handleRunTest(selectedItem) : handleRunAction(selectedItem)}
          >
            <Play className="h-4 w-4 mr-2 fill-current" />
            Run {isTest ? 'Test' : 'Action'}
          </Button>
        </div>

        <div className="space-y-6">
          {isTest ? (
            <>
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Test Title</label>
                <Input
                  value={selectedItem.testTitle}
                  onChange={(e) => {
                    selectedItem.testTitle = e.target.value
                    setPlan({ ...plan })
                    setIsDirty(true)
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isEnabled"
                  checked={selectedItem.isEnabled}
                  onChange={(e) => {
                    selectedItem.isEnabled = e.target.checked
                    setPlan({ ...plan })
                    setIsDirty(true)
                  }}
                  className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                />
                <label htmlFor="isEnabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Enabled</label>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none">Action Title</label>
                <Input
                  value={selectedItem.actionTitle}
                  onChange={(e) => {
                    selectedItem.actionTitle = e.target.value
                    setPlan({ ...plan })
                    setIsDirty(true)
                  }}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none">Action Type</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={selectedItem.actionType || "Click"}
                  onChange={(e) => {
                    const newType = e.target.value
                    selectedItem.actionType = newType
                    // Reset params to default for the new type
                    const plugin = actionRegistry.get(newType)
                    if (plugin) {
                      // Deep copy default params to avoid reference issues
                      selectedItem.params = JSON.parse(JSON.stringify(plugin.defaultParams))
                    }
                    setPlan({ ...plan })
                    setIsDirty(true)
                  }}
                >
                  {actionRegistry.getAll().map(plugin => (
                    <option key={plugin.type} value={plugin.type}>{plugin.label}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Action Editor */}
              {(() => {
                const plugin = actionRegistry.get(selectedItem.actionType)
                if (plugin && plugin.Editor) {
                  const Editor = plugin.Editor
                  return (
                    <div className="border rounded-md p-4 bg-accent/20">
                      <Editor
                        params={selectedItem.params || {}}
                        onChange={(newParams) => {
                          selectedItem.params = newParams
                          setPlan({ ...plan })
                          setIsDirty(true)
                        }}
                      />
                    </div>
                  )
                }
                return (
                  <div className="text-sm text-muted-foreground">
                    No editor available for action type: {selectedItem.actionType}
                  </div>
                )
              })()}
            </>
          )}

          {/* Logs Section */}
          <div className="pt-6 border-t mt-6 pb-20">
            <h3 className="text-sm font-semibold mb-3">Execution Log</h3>
            {logs[selectedItem.actionID] || logs[selectedItem.testID] ? (
              <div className="bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto">
                {logs[selectedItem.actionID] && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded textxs font-bold ${logs[selectedItem.actionID].status === 'Success' ? 'bg-green-500/20 text-green-600' :
                        logs[selectedItem.actionID].status === 'Failed' || logs[selectedItem.actionID].status === 'Error' ? 'bg-red-500/20 text-red-600' :
                          'bg-blue-500/20 text-blue-600'
                        }`}>
                        {logs[selectedItem.actionID].status}
                      </span>
                      <span className="text-muted-foreground text-xs">{logs[selectedItem.actionID].timestamp}</span>
                    </div>
                    <pre className="text-xs">{JSON.stringify(logs[selectedItem.actionID].details, null, 2)}</pre>
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No logs available. Run the action to see results.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ... (render)

  return (
    <div className="flex flex-col h-full">
      {/* Header ... */}
      <header className="flex items-center justify-between border-b pb-4 mb-4 px-4">
        {/* ... existing header content ... */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Input
            value={plan.title}
            onChange={handleTitleChange}
            className="text-2xl font-bold h-auto py-1 px-2 border-transparent hover:border-input focus:border-input w-[400px]"
          />
        </div>
        <div className="flex items-center gap-2">
          {saveStatus && <span className="text-sm text-green-500 font-medium animate-fade-out">{saveStatus}</span>}
          <Button
            variant="outline"
            className="text-emerald-500 border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
            onClick={handleRunAll}
            title="Run All Tests"
          >
            <Play className="mr-2 h-4 w-4 fill-current" /> Run All
          </Button>
          <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button onClick={handleSave} disabled={!isDirty} title="Save">
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/3 border-r flex flex-col bg-card/50">
          <ScrollArea className="flex-1">
            <TestTree
              testPlan={plan.testPlan}
              selectedItem={selectedItem}
              onSelect={setSelectedItem}
              onEdit={() => {
                setIsDirty(true)
                setPlan({ ...plan })
              }}
              onAddTest={handleAddTest}
              onAddAction={handleAddAction}
              onReorderTests={handleReorderTests}
              onReorderActions={handleReorderActions}
              onDeleteTest={handleDeleteTest}
              onDeleteAction={handleDeleteAction}
              onRunTest={handleRunTest}
              onRunAction={handleRunAction}
            />
          </ScrollArea>
        </aside>

        <main className="flex-1 bg-background overflow-auto">
          {renderRightPanel()}
        </main>
      </div>
    </div>
  )
}
