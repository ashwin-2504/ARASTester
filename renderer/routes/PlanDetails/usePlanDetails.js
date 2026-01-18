import { useState, useEffect, useCallback } from 'react'
import * as TestPlanAdapter from '@/core/adapters/TestPlanAdapter'
import { ActionExecutor } from '@/core/services/ActionExecutor'
import { actionRegistry } from '@/core/registries/ActionRegistry'
import actionSchemas from '@/core/schemas/action-schemas.json'


export function usePlanDetails(filename, onNavigate) {
  const [plan, setPlan] = useState({ testPlan: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const [logs, setLogs] = useState({})
  const [saveStatus, setSaveStatus] = useState('')

  // Ensure unique IDs for all items
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

  const loadPlan = useCallback(async () => {
    try {
      setLoading(true)
      const data = await TestPlanAdapter.getPlan(filename)
      setPlan(ensureIds(data))
      setIsDirty(false)
      setError(null)
      setSelectedItem(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filename])

  useEffect(() => {
    loadPlan()
  }, [loadPlan])

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
    const defaultType = actionRegistry.getAll()[0]?.type || 'Custom'
    const plugin = actionRegistry.get(defaultType)
    const newAction = {
      actionTitle: "New Action",
      actionType: defaultType,
      actionID: `A${Date.now()}`,
      isEnabled: true,
      params: plugin ? JSON.parse(JSON.stringify(plugin.defaultParams)) : {}
    }

    // Find test index to update
    const testIndex = plan.testPlan.findIndex(t => t.testID === test.testID)
    if (testIndex === -1) return

    const newPlan = { ...plan }
    if (!newPlan.testPlan[testIndex].testActions) newPlan.testPlan[testIndex].testActions = []
    newPlan.testPlan[testIndex].testActions.push(newAction)

    setPlan(newPlan)
    setIsDirty(true)
    setSelectedItem(newAction)
  }

  const handleDeleteTest = (testId) => {
    if (!confirm("Delete this test and all its actions?")) return
    setPlan(prev => ({
      ...prev,
      testPlan: prev.testPlan.filter(t => t.testID !== testId)
    }))
    if (selectedItem?.testID === testId) setSelectedItem(null)
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
    if (selectedItem?.actionID === actionId) setSelectedItem(null)
    setIsDirty(true)
  }

  // Helper for reordering list
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const handleMoveTest = (sourceIndex, destinationIndex) => {
    setPlan((prev) => {
      const newTests = reorder(prev.testPlan, sourceIndex, destinationIndex);
      return { ...prev, testPlan: newTests };
    });
    setIsDirty(true);
  }

  const handleMoveAction = (sourceTestId, sourceIndex, destTestId, destIndex) => {
    // Deep clone logic - synchronous
    const newPlan = { ...plan };
    newPlan.testPlan = [...plan.testPlan];

    const sourceTestIndex = newPlan.testPlan.findIndex(t => t.testID === sourceTestId);
    const destTestIndex = newPlan.testPlan.findIndex(t => t.testID === destTestId);

    if (sourceTestIndex === -1 || destTestIndex === -1) return;

    // Clone tests
    const sourceTest = { ...newPlan.testPlan[sourceTestIndex], testActions: [...(newPlan.testPlan[sourceTestIndex].testActions || [])] };
    const destTest = (sourceTestIndex === destTestIndex)
      ? sourceTest
      : { ...newPlan.testPlan[destTestIndex], testActions: [...(newPlan.testPlan[destTestIndex].testActions || [])] };

    // Move logic
    if (sourceIndex < 0 || sourceIndex >= sourceTest.testActions.length) return;
    const [movedAction] = sourceTest.testActions.splice(sourceIndex, 1);

    if (!movedAction) return;

    destTest.testActions.splice(destIndex, 0, movedAction);

    // Update plan structure
    newPlan.testPlan[sourceTestIndex] = sourceTest;
    newPlan.testPlan[destTestIndex] = destTest;

    // 1. Update Plan State
    setPlan(newPlan);
    setIsDirty(true);

    // 2. Update Selected Item State if needed
    // If the moved action was the selected one, re-set it to ensure fresh reference/context
    if (selectedItem?.actionID === movedAction.actionID) {
      setSelectedItem(movedAction);
    }
  }

  const handleRunAction = async (action) => {
    setLogs(prev => ({ ...prev, [action.actionID]: { status: 'Running...', timestamp: new Date().toISOString() } }))

    const result = await ActionExecutor.execute(action)

    setLogs(prev => ({
      ...prev, [action.actionID]: {
        status: result.success ? 'Success' : 'Failed',
        details: result,
        timestamp: new Date().toISOString()
      }
    }))
  }

  const handleRunTest = async (test) => {
    console.log(`▶️ Running: ${test.testTitle}`)
    for (const action of test.testActions || []) {
      if (action.isEnabled !== false) await handleRunAction(action)
    }
  }

  const handleRunAll = async () => {
    if (isDirty) await handleSave()
    for (const test of plan.testPlan || []) {
      if (test.isEnabled !== false) await handleRunTest(test)
    }
  }

  const updateSelectedItem = (updates) => {
    if (!selectedItem) return

    setPlan(currentPlan => {
      // 1. Shallow clone the plan object
      const newPlan = { ...currentPlan };

      // 2. clone the testPlan array (critical for array immutability)
      newPlan.testPlan = [...currentPlan.testPlan];

      let newItemReference = null;

      // Check if it's a test
      const testIdx = newPlan.testPlan.findIndex(t => t.testID === selectedItem.testID);

      if (testIdx !== -1 && !selectedItem.hasOwnProperty('actionID')) {
        // --- UPDATING A TEST ---
        // Clone the specific test object
        const updatedTest = { ...newPlan.testPlan[testIdx], ...updates };
        // Replace in array
        newPlan.testPlan[testIdx] = updatedTest;
        newItemReference = updatedTest;
      } else {
        // --- UPDATING AN ACTION ---
        // We need to find which test contains this action (it might be selectedItem.actionID)
        // Note: selectedItem might be stale, so we search by ID.
        // We iterate to find the test containing the action.
        const parentTestIndex = newPlan.testPlan.findIndex(t =>
          t.testActions && t.testActions.some(a => a.actionID === selectedItem.actionID)
        );

        if (parentTestIndex !== -1) {
          // Clone the parent test
          const parentTest = { ...newPlan.testPlan[parentTestIndex] };
          // Clone the actions array
          parentTest.testActions = [...parentTest.testActions];

          const actionIdx = parentTest.testActions.findIndex(a => a.actionID === selectedItem.actionID);

          if (actionIdx !== -1) {
            // Clone the action
            const updatedAction = { ...parentTest.testActions[actionIdx], ...updates };
            // Replace action in the array
            parentTest.testActions[actionIdx] = updatedAction;
            // Replace test in the plan
            newPlan.testPlan[parentTestIndex] = parentTest;
            newItemReference = updatedAction;
          }
        }
      }

      if (newItemReference) {
        setSelectedItem(newItemReference); // Update selected item reference to avoid stale state
        setIsDirty(true);
        return newPlan;
      }

      return currentPlan; // No change found
    });
  }

  const handleToggleEnabled = (item) => {
    setPlan(currentPlan => {
      const newPlan = { ...currentPlan };
      newPlan.testPlan = [...currentPlan.testPlan];

      // Check if it's a test
      const testIdx = newPlan.testPlan.findIndex(t => t.testID === item.testID);

      if (testIdx !== -1 && !item.actionID) {
        // Toggle Test
        newPlan.testPlan[testIdx] = {
          ...newPlan.testPlan[testIdx],
          isEnabled: newPlan.testPlan[testIdx].isEnabled === false ? true : false
        };
        // Also update selectedItem if it matches
        if (selectedItem?.testID === item.testID) {
          setSelectedItem(newPlan.testPlan[testIdx]);
        }
      } else {
        // Find parent test for Action
        const parentTestIndex = newPlan.testPlan.findIndex(t =>
          t.testActions && t.testActions.some(a => a.actionID === item.actionID)
        );

        if (parentTestIndex !== -1) {
          const parentTest = { ...newPlan.testPlan[parentTestIndex] };
          parentTest.testActions = [...parentTest.testActions];

          const actionIdx = parentTest.testActions.findIndex(a => a.actionID === item.actionID);

          if (actionIdx !== -1) {
            const updatedAction = {
              ...parentTest.testActions[actionIdx],
              isEnabled: parentTest.testActions[actionIdx].isEnabled === false ? true : false
            };
            parentTest.testActions[actionIdx] = updatedAction;
            newPlan.testPlan[parentTestIndex] = parentTest;

            // Update selectedItem if it matches
            if (selectedItem?.actionID === item.actionID) {
              setSelectedItem(updatedAction);
            }
          }
        }
      }
      setIsDirty(true);
      return newPlan;
    });
  }

  return {
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
  }
}
