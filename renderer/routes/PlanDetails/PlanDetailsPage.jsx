import React, { useState, useEffect } from 'react'
import { ChevronLeft, RotateCcw, Save, Play, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import TestPlanAdapter from '@/core/adapters/TestPlanAdapter'
import { arrayMove } from '@dnd-kit/sortable'
import { actionRegistry } from '@/core/registries/ActionRegistry'

export default function PlanDetailsPage({ filename, onNavigate, onBack }) {
  const [plan, setPlan] = useState({ testPlan: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const [logs, setLogs] = useState({})
  const [saveStatus, setSaveStatus] = useState('')
  const [expandedTests, setExpandedTests] = useState({})

  const ensureIds = (data) => {
    if (!data.testPlan) return data
    data.testPlan.forEach(t => {
      if (!t.testID) t.testID = `T${Math.random().toString(36).substr(2, 9)}`
      if (t.testActions) {
        t.testActions.forEach((a) => {
          if (!a.actionID) a.actionID = `A${Math.random().toString(36).substr(2, 9)}`
        })
      }
    })
    return data
  }

  const loadPlan = async () => {
    try {
      setLoading(true)
      const data = await TestPlanAdapter.getPlan(filename)
      const withIds = ensureIds(data)
      setPlan(withIds)
      // Expand all tests by default
      const expanded = {}
      withIds.testPlan?.forEach(t => { expanded[t.testID] = true })
      setExpandedTests(expanded)
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
      await TestPlanAdapter.updatePlan(filename, plan)
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
    onBack?.() || onNavigate?.('dashboard')
  }

  const handleRefresh = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Discard them?')) return
    }
    loadPlan()
  }

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
    setExpandedTests({ ...expandedTests, [newTest.testID]: true })
    setIsDirty(true)
    setSelectedItem(newTest)
  }

  const handleAddAction = (test) => {
    const defaultType = actionRegistry.getAll()[0]?.type || 'Custom'
    const plugin = actionRegistry.get(defaultType)
    const newAction = {
      actionTitle: "New Action",
      actionType: defaultType,
      actionID: `A${Date.now()}`,
      isEnabled: true,
      params: plugin ? JSON.parse(JSON.stringify(plugin.defaultParams)) : {}
    }
    if (!test.testActions) test.testActions = []
    test.testActions.push(newAction)
    setPlan({ ...plan })
    setIsDirty(true)
    setSelectedItem(newAction)
  }

  const handleDeleteTest = (testId) => {
    if (!confirm("Delete this test and all its actions?")) return
    setPlan(prev => ({
      ...prev,
      testPlan: prev.testPlan.filter(t => t.testID !== testId)
    }))
    setSelectedItem(null)
    setIsDirty(true)
  }

  const handleDeleteAction = (actionId) => {
    if (!confirm("Delete this action?")) return
    setPlan(prev => {
      const newPlan = { ...prev }
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

  // === Run Handlers ===
  const handleRunAll = async () => {
    // Auto-save before running
    if (isDirty) {
      console.log('💾 Auto-saving before run...')
      await handleSave()
    }
    console.log('🚀 Running all tests')
    for (const test of plan.testPlan || []) {
      if (test.isEnabled !== false) await handleRunTest(test)
    }
  }

  const handleRunTest = async (test) => {
    console.log(`▶️ Running: ${test.testTitle}`)
    for (const action of test.testActions || []) {
      if (action.isEnabled !== false) await handleRunAction(action)
    }
  }

  const handleRunAction = async (action) => {
    setLogs(prev => ({ ...prev, [action.actionID]: { status: 'Running...', timestamp: new Date().toISOString() } }))

    try {
      const plugin = actionRegistry.get(action.actionType)

      // Handle client-side only actions (Wait, SetVariable, LogMessage, etc.)
      if (plugin?.isClientSide) {
        const result = await executeClientSideAction(action, plugin)
        setLogs(prev => ({
          ...prev, [action.actionID]: {
            status: result.success ? 'Success' : 'Failed',
            details: result,
            timestamp: new Date().toISOString()
          }
        }))
        return
      }

      // Handle server-side actions via API
      if (plugin?.apiEndpoint) {
        const response = await fetch(`http://localhost:5000${plugin.apiEndpoint}`, {
          method: plugin.apiMethod || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: plugin.apiMethod === 'GET' ? undefined : JSON.stringify(action.params || {})
        })
        const data = await response.json()
        setLogs(prev => ({
          ...prev, [action.actionID]: {
            status: data.success ? 'Success' : 'Failed',
            details: data,
            timestamp: new Date().toISOString()
          }
        }))
      } else {
        // Unknown action type - log warning
        setLogs(prev => ({
          ...prev, [action.actionID]: {
            status: 'Warning',
            details: { message: `No handler for action type: ${action.actionType}` },
            timestamp: new Date().toISOString()
          }
        }))
      }
    } catch (err) {
      setLogs(prev => ({
        ...prev, [action.actionID]: {
          status: 'Error',
          details: { message: err.message },
          timestamp: new Date().toISOString()
        }
      }))
    }
  }

  // Execute client-side actions (no API call needed)
  const executeClientSideAction = async (action, plugin) => {
    switch (action.actionType) {
      case 'Wait':
        const duration = action.params?.duration || 1000
        await new Promise(r => setTimeout(r, duration))
        return { success: true, message: `Waited ${duration}ms` }

      case 'LogMessage':
        console.log(`[${action.params?.level || 'info'}]`, action.params?.message)
        return { success: true, message: action.params?.message }

      case 'SetVariable':
        // Variables would be stored in a context - for now just log
        console.log(`Set variable: ${action.params?.variableName} = ${action.params?.value}`)
        return { success: true, variableName: action.params?.variableName, value: action.params?.value }

      case 'Custom':
        // Custom code execution - simplified for now
        console.log('Custom script:', action.params?.code)
        return { success: true, message: 'Custom script executed' }

      default:
        return { success: true, message: 'Action completed' }
    }
  }

  const toggleTest = (testId) => {
    setExpandedTests(prev => ({ ...prev, [testId]: !prev[testId] }))
  }

  const isTest = (item) => item?.hasOwnProperty('testID')

  if (loading) return <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
  if (error) return <div className="flex h-full items-center justify-center text-red-500">{error}</div>

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex-none h-16 border-b px-6 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
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
          <Button variant="ghost" size="icon" onClick={handleRefresh}>
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
          <ScrollArea className="flex-1 p-4">
            <div className="border rounded-lg overflow-hidden bg-muted/30">
              {plan.testPlan?.map((test, testIndex) => (
                <div key={test.testID}>
                  {/* Test Row */}
                  <div
                    className={`group flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer border-b border-border/50 ${selectedItem?.testID === test.testID ? 'bg-amber-500/10 border-l-[3px] border-l-amber-500' : ''}`}
                    onClick={() => setSelectedItem(test)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <button onClick={(e) => { e.stopPropagation(); toggleTest(test.testID) }} className="text-muted-foreground">
                        {expandedTests[test.testID] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <input
                        type="checkbox"
                        checked={test.isEnabled !== false}
                        onChange={(e) => { e.stopPropagation(); test.isEnabled = e.target.checked; setPlan({ ...plan }); setIsDirty(true) }}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-sm font-medium truncate">{test.testTitle}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleRunTest(test) }} className="text-emerald-500 p-1 hover:bg-emerald-500/10 rounded">
                        <Play className="h-3 w-3 fill-current" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleAddAction(test) }} className="text-muted-foreground p-1 hover:bg-muted rounded">
                        <Plus className="h-3 w-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTest(test.testID) }} className="text-muted-foreground hover:text-red-500 p-1 hover:bg-red-500/10 rounded">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  {expandedTests[test.testID] && test.testActions?.map((action) => (
                    <div
                      key={action.actionID}
                      className={`group flex items-center justify-between py-2 pr-2 pl-10 hover:bg-muted/50 cursor-pointer ${selectedItem?.actionID === action.actionID ? 'bg-amber-500/10 border-l-[3px] border-l-amber-500' : ''}`}
                      onClick={() => setSelectedItem(action)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={action.isEnabled !== false}
                          onChange={(e) => { e.stopPropagation(); action.isEnabled = e.target.checked; setPlan({ ...plan }); setIsDirty(true) }}
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-sm truncate">{action.actionTitle}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleRunAction(action) }} className="text-emerald-500 p-1 hover:bg-emerald-500/10 rounded">
                          <Play className="h-3 w-3 fill-current" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteAction(action.actionID) }} className="text-muted-foreground hover:text-red-500 p-1 hover:bg-red-500/10 rounded">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Add Test Button */}
            <button
              onClick={handleAddTest}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-muted/30 transition-all text-sm font-medium"
            >
              <Plus className="h-4 w-4" /> Add Test
            </button>
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
                  onClick={() => isTest(selectedItem) ? handleRunTest(selectedItem) : handleRunAction(selectedItem)}
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
                        value={selectedItem.testTitle}
                        onChange={(e) => { selectedItem.testTitle = e.target.value; setPlan({ ...plan }); setIsDirty(true) }}
                        className="bg-muted/30"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="testEnabled"
                        checked={selectedItem.isEnabled !== false}
                        onChange={(e) => { selectedItem.isEnabled = e.target.checked; setPlan({ ...plan }); setIsDirty(true) }}
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
                        value={selectedItem.actionTitle}
                        onChange={(e) => { selectedItem.actionTitle = e.target.value; setPlan({ ...plan }); setIsDirty(true) }}
                        className="bg-muted/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Action Type</label>
                      <div className="relative">
                        <select
                          value={selectedItem.actionType}
                          onChange={(e) => {
                            const newType = e.target.value
                            selectedItem.actionType = newType
                            const plugin = actionRegistry.get(newType)
                            if (plugin) selectedItem.params = JSON.parse(JSON.stringify(plugin.defaultParams))
                            setPlan({ ...plan })
                            setIsDirty(true)
                          }}
                          className="w-full appearance-none rounded-md border border-input bg-muted/30 px-4 py-2.5 text-sm focus:border-primary focus:ring-primary pr-10"
                        >
                          {actionRegistry.getAll().map(p => (
                            <option key={p.type} value={p.type}>{p.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    {/* Dynamic Action Editor */}
                    {(() => {
                      const plugin = actionRegistry.get(selectedItem.actionType)
                      if (plugin?.Editor) {
                        const Editor = plugin.Editor
                        return (
                          <div className="mt-6 rounded-lg border bg-muted/20 p-5 space-y-5">
                            <Editor
                              params={selectedItem.params || {}}
                              onChange={(newParams) => { selectedItem.params = newParams; setPlan({ ...plan }); setIsDirty(true) }}
                            />
                          </div>
                        )
                      }
                      return null
                    })()}
                  </>
                )}

                {/* Execution Log */}
                {!isTest(selectedItem) && logs[selectedItem.actionID] && (
                  <div className="pt-6 border-t mt-6">
                    <h3 className="text-sm font-semibold mb-3">Execution Log</h3>
                    <div className="bg-muted/30 p-4 rounded-md text-sm font-mono">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${logs[selectedItem.actionID].status === 'Success' ? 'bg-emerald-500/20 text-emerald-500' :
                          logs[selectedItem.actionID].status === 'Failed' || logs[selectedItem.actionID].status === 'Error' ? 'bg-red-500/20 text-red-500' :
                            logs[selectedItem.actionID].status === 'Warning' ? 'bg-amber-500/20 text-amber-500' :
                              'bg-blue-500/20 text-blue-500'
                          }`}>
                          {logs[selectedItem.actionID].status}
                        </span>
                        <span className="text-xs text-muted-foreground">{logs[selectedItem.actionID].timestamp}</span>
                      </div>
                      {logs[selectedItem.actionID].details && (
                        <pre className="text-xs overflow-x-auto">{JSON.stringify(logs[selectedItem.actionID].details, null, 2)}</pre>
                      )}
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
