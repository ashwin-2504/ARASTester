import { useState, useEffect, useCallback } from "react";
import { produce } from "immer";
import * as TestPlanAdapter from "@/core/adapters/TestPlanAdapter";
import { ActionExecutor } from "@/core/services/ActionExecutor";
import { actionRegistry } from "@/core/registries/ActionRegistry";
import { apiClient } from "@/core/api/client";
import { generateTestId, generateActionId } from "@/lib/idGenerator";
import { confirm } from "@/lib/hooks/useConfirmDialog";
import type { TestPlan, Test, Action } from "@/types/plan";

export function usePlanDetails(filename: string, _onNavigate?: (path: string) => void) {
  const [plan, setPlan] = useState<Partial<TestPlan> & { testPlan: Test[] }>({ testPlan: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Test | Action | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [logs, setLogs] = useState<Record<string, { status: string; timestamp: string; details?: any }>>({});
  const [saveStatus, setSaveStatus] = useState("");

  // Ensure unique IDs for all items (backfill for legacy data)
  const ensureIds = (data: TestPlan): TestPlan => {
    if (!data.testPlan) return data;
    data.testPlan.forEach((t) => {
      if (!t.testID) t.testID = generateTestId();
      if (t.testActions) {
        t.testActions.forEach((a) => {
          if (!a.actionID) a.actionID = generateActionId();
        });
      }
    });
    return data;
  };

  const loadPlan = useCallback(async () => {
    try {
      setLoading(true);
      const data = await TestPlanAdapter.getPlan(filename);
      // @ts-ignore - Ensure Ids modifies in place or return
      setPlan(ensureIds(data));
      setIsDirty(false);
      setError(null);
      setSelectedItem(null);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [filename]);

  useEffect(() => {
    loadPlan();

    // Cleanup: cancel pending API requests when leaving
    return () => {
      apiClient.cancelAll();
    };
  }, [loadPlan]);

  const handleSave = async () => {
    try {
      await TestPlanAdapter.updatePlan(filename, plan as TestPlan);
      setIsDirty(false);
      setSaveStatus("Saved!");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleAddTest = () => {
    const newTest: Test = {
      testTitle: "New Test",
      testID: generateTestId(),
      isEnabled: true,
      testActions: [],
    };
    const newPlan = { ...plan };
    if (!newPlan.testPlan) newPlan.testPlan = [];
    newPlan.testPlan.push(newTest);
    setPlan(newPlan);
    setIsDirty(true);
    setSelectedItem(newTest);
  };

  const handleAddAction = (test: Test) => {
    const defaultType = actionRegistry.getAll()[0]?.type || "Custom";
    const plugin = actionRegistry.get(defaultType);
    const newAction: Action = {
      actionTitle: "New Action",
      actionType: defaultType,
      actionID: generateActionId(),
      isEnabled: true,
      params: plugin ? JSON.parse(JSON.stringify(plugin.defaultParams)) : {},
    };

    // Find test index to update
    const testIndex = plan.testPlan.findIndex((t) => t.testID === test.testID);
    if (testIndex === -1) return;

    const newPlan = { ...plan };
    if (!newPlan.testPlan[testIndex].testActions)
      newPlan.testPlan[testIndex].testActions = [];
    newPlan.testPlan[testIndex].testActions.push(newAction);

    setPlan(newPlan);
    setIsDirty(true);
    setSelectedItem(newAction);
  };

  const handleDeleteTest = async (testId: string) => {
    const confirmed = await confirm({
      title: "Delete Test",
      description: "Delete this test and all its actions?",
      confirmText: "Delete",
      variant: "destructive",
    });
    if (!confirmed) return;

    setPlan((prev) => ({
      ...prev,
      testPlan: prev.testPlan.filter((t) => t.testID !== testId),
    }));
    // @ts-ignore - Check if selected item is the deleted test
    if (selectedItem?.testID === testId) setSelectedItem(null);
    setIsDirty(true);
  };

  const handleDeleteAction = async (actionId: string) => {
    const confirmed = await confirm({
      title: "Delete Action",
      description: "Delete this action?",
      confirmText: "Delete",
      variant: "destructive",
    });
    if (!confirmed) return;

    setPlan((prev) => {
      const newPlan = { ...prev };
      newPlan.testPlan.forEach((t) => {
        if (t.testActions) {
          t.testActions = t.testActions.filter((a) => a.actionID !== actionId);
        }
      });
      return newPlan;
    });
    // @ts-ignore - Check if selected item is the deleted action
    if (selectedItem?.actionID === actionId) setSelectedItem(null);
    setIsDirty(true);
  };

  // Helper for reordering list
  const reorder = <T>(list: T[], startIndex: number, endIndex: number): T[] => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const handleMoveTest = (sourceIndex: number, destinationIndex: number) => {
    setPlan((prev) => {
      const newTests = reorder(prev.testPlan, sourceIndex, destinationIndex);
      return { ...prev, testPlan: newTests };
    });
    setIsDirty(true);
  };

  const handleMoveAction = (
    sourceTestId: string,
    sourceIndex: number,
    destTestId: string,
    destIndex: number,
  ) => {
    let movedAction: Action | null = null;

    setPlan(
      produce((draft) => {
        const sourceTest = draft.testPlan.find(
          (t: Test) => t.testID === sourceTestId,
        );
        const destTest = draft.testPlan.find((t: Test) => t.testID === destTestId);

        if (!sourceTest || !destTest) return;
        if (
          !sourceTest.testActions ||
          sourceIndex < 0 ||
          sourceIndex >= sourceTest.testActions.length
        )
          return;

        // Remove from source
        [movedAction] = sourceTest.testActions.splice(sourceIndex, 1);
        if (!movedAction) return;

        // Insert at destination
        if (!destTest.testActions) destTest.testActions = [];
        destTest.testActions.splice(destIndex, 0, movedAction);
      }),
    );

    setIsDirty(true);

    // Update selectedItem if the moved action was selected
    // @ts-ignore
    if (movedAction && selectedItem?.actionID === movedAction.actionID) {
      setSelectedItem(movedAction);
    }
  };

  const handleRunAction = async (action: Action) => {
    setLogs((prev) => ({
      ...prev,
      [action.actionID]: {
        status: "Running...",
        timestamp: new Date().toISOString(),
      },
    }));

    const result = await ActionExecutor.execute(action);

    setLogs((prev) => ({
      ...prev,
      [action.actionID]: {
        status: result.success ? "Success" : "Failed",
        details: result,
        timestamp: new Date().toISOString(),
      },
    }));
  };

  const handleRunTest = async (test: Test) => {
    console.log(`▶️ Running: ${test.testTitle}`);
    for (const action of test.testActions || []) {
      if (action.isEnabled !== false) await handleRunAction(action);
    }
  };

  const handleRunAll = async () => {
    if (isDirty) await handleSave();
    for (const test of plan.testPlan || []) {
      if (test.isEnabled !== false) await handleRunTest(test);
    }
  };

  const updateSelectedItem = (updates: Partial<Test> | Partial<Action>) => {
    if (!selectedItem) return;

    let newItemReference: Test | Action | null = null;

    setPlan(
      produce((draft) => {
        // Check if updating a test (no actionID) or an action
        if (!("actionID" in selectedItem)) {
          // Updating a Test
          const test = draft.testPlan.find(
            (t: Test) => t.testID === (selectedItem as Test).testID,
          );
          if (test) {
            Object.assign(test, updates);
            newItemReference = { ...test };
          }
        } else {
          // Updating an Action
          for (const test of draft.testPlan) {
            if (!test.testActions) continue;
            const action = test.testActions.find(
              (a: Action) => a.actionID === (selectedItem as Action).actionID,
            );
            if (action) {
              Object.assign(action, updates);
              newItemReference = { ...action };
              break;
            }
          }
        }
      }),
    );

    if (newItemReference) {
      setSelectedItem(newItemReference);
      setIsDirty(true);
    }
  };

  const handleToggleEnabled = (item: Test | Action) => {
    let updatedItem: Test | Action | null = null;

    setPlan(
      produce((draft) => {
        if (!("actionID" in item)) {
          // Toggle Test
          const test = draft.testPlan.find((t: Test) => t.testID === (item as Test).testID);
          if (test) {
            test.isEnabled = test.isEnabled === false ? true : false;
            updatedItem = { ...test };
          }
        } else {
          // Toggle Action
          for (const test of draft.testPlan) {
            if (!test.testActions) continue;
            const action = test.testActions.find(
              (a: Action) => a.actionID === (item as Action).actionID,
            );
            if (action) {
              action.isEnabled = action.isEnabled === false ? true : false;
              updatedItem = { ...action };
              break;
            }
          }
        }
      }),
    );

    setIsDirty(true);

    // Update selectedItem if it matches the toggled item
    if (updatedItem) {
      if (!("actionID" in item) && (selectedItem as Test)?.testID === (item as Test).testID) {
        setSelectedItem(updatedItem);
      } else if (("actionID" in item) && (selectedItem as Action)?.actionID === (item as Action).actionID) {
        setSelectedItem(updatedItem);
      }
    }
  };

  return {
    plan,
    loading,
    error,
    isDirty,
    saveStatus,
    logs,
    selectedItem,
    setSelectedItem,
    loadPlan,
    handleSave,
    handleAddTest,
    handleAddAction,
    handleDeleteTest,
    handleDeleteAction,
    handleMoveTest,
    handleMoveAction,
    handleRunAll,
    handleRunTest,
    handleRunAction,
    updateSelectedItem,
    handleToggleEnabled,
  };
}
