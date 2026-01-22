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
    if (!data.profiles) data.profiles = [];
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
    
    setPlan((prev) => 
      produce(prev, (draft) => {
        if (!draft.testPlan) draft.testPlan = [];
        draft.testPlan.push(newTest);
      })
    );
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

    const testId = test.testID;

    setPlan((prev) =>
      produce(prev, (draft) => {
        const targetTest = draft.testPlan.find((t) => t.testID === testId);
        if (!targetTest) return;
        if (!targetTest.testActions) targetTest.testActions = [];
        targetTest.testActions.push(newAction);
      })
    );
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

    setPlan((prev) =>
      produce(prev, (draft) => {
        draft.testPlan.forEach((t) => {
          if (t.testActions) {
            t.testActions = t.testActions.filter((a) => a.actionID !== actionId);
          }
        });
      })
    );
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

  const handleRunAction = async (action: Action, sessionName?: string) => {
    setLogs((prev) => ({
      ...prev,
      [action.actionID]: {
        status: "Running...",
        timestamp: new Date().toISOString(),
      },
    }));

    const result = await ActionExecutor.execute(action, sessionName);

    setLogs((prev) => ({
      ...prev,
      [action.actionID]: {
        status: result.success ? "Success" : "Failed",
        details: result,
        timestamp: new Date().toISOString(),
      },
    }));
  };

  // Profile Management
  const handleAddProfile = (profile: any) => {
    setPlan((prev) =>
      produce(prev, (draft) => {
        if (!draft.profiles) draft.profiles = [];
        draft.profiles.push(profile);
      })
    );
    setIsDirty(true);
  };

  const handleUpdateProfile = (id: string, updates: any) => {
    setPlan((prev) =>
      produce(prev, (draft) => {
        const profile = draft.profiles?.find((p) => p.id === id);
        if (profile) Object.assign(profile, updates);
      })
    );
    setIsDirty(true);
  };

  const handleDeleteProfile = (id: string) => {
    setPlan((prev) =>
      produce(prev, (draft) => {
        if (draft.profiles) {
          draft.profiles = draft.profiles.filter((p) => p.id !== id);
        }
      })
    );
    setIsDirty(true);
  };

  const ensureSession = async (profileId: string): Promise<string | undefined> => {
    const profile = plan.profiles?.find((p) => p.id === profileId);
    if (!profile) return undefined;

    const { useSessionStore } = await import("@/stores/useSessionStore");
    const store = useSessionStore.getState();
    
    // Check if session with this name exists
    const existing = store.activeSessions.find((s) => s.name === profile.name);
    if (existing) return existing.name;

    // Not active, try to login
    console.log(`🔌 Auto-connecting session: ${profile.name}`);
    if (!profile.password) {
      console.warn("Cannot auto-connect: Password missing in profile");
      return undefined; // Fallback to prompt or fail?
    }

    try {
      const result = await store.login({
        url: profile.url,
        database: profile.database,
        username: profile.username,
        password: profile.password,
        sessionName: profile.name,
      });

      if (result.success) {
        return result.sessionName || profile.name;
      } else {
        console.error("Auto-connect failed:", result.message);
        return undefined;
      }
    } catch (err) {
      console.error("Auto-connect error:", err);
      return undefined;
    }
  };

  const handleRunTest = async (test: Test) => {
    let sessionName: string | undefined = undefined;
    
    // Resolve session if profile ID is present
    if (test.sessionProfileId) {
        sessionName = await ensureSession(test.sessionProfileId);
    }

    console.log(`▶️ Running: ${test.testTitle} [Session: ${sessionName || "Default"}]`);
    
    for (const action of test.testActions || []) {
      if (action.isEnabled !== false) await handleRunAction(action, sessionName);
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

    // Determine the ID to find the item after state update
    const isAction = "actionID" in selectedItem;
    const itemId = isAction
      ? (selectedItem as Action).actionID
      : (selectedItem as Test).testID;

    // We'll capture the updated item here
    let updatedItemCopy: Test | Action | null = null;

    setPlan((prevPlan) => {
      // Use produce to update the plan immutably
      const newPlan = produce(prevPlan, (draft) => {
        if (!isAction) {
          // Updating a Test
          const test = draft.testPlan.find(
            (t: Test) => t.testID === itemId,
          );
          if (test) {
            Object.assign(test, updates);
          }
        } else {
          // Updating an Action
          for (const test of draft.testPlan) {
            if (!test.testActions) continue;
            const action = test.testActions.find(
              (a: Action) => a.actionID === itemId,
            );
            if (action) {
              Object.assign(action, updates);
              break;
            }
          }
        }
      });

      // After produce, find the updated item from the NEW (non-proxy) state
      let updatedItem: Test | Action | null = null;
      if (!isAction) {
        updatedItem = newPlan.testPlan.find((t) => t.testID === itemId) || null;
      } else {
        for (const test of newPlan.testPlan) {
          if (!test.testActions) continue;
          const action = test.testActions.find((a) => a.actionID === itemId);
          if (action) {
            updatedItem = action;
            break;
          }
        }
      }

      // Create a plain copy to ensure no proxy references
      if (updatedItem) {
        updatedItemCopy = JSON.parse(JSON.stringify(updatedItem));
      }

      return newPlan;
    });

    // Update selectedItem synchronously after setPlan
    if (updatedItemCopy) {
      setSelectedItem(updatedItemCopy);
    }
    setIsDirty(true);
  };

  const handleToggleEnabled = (item: Test | Action) => {
    const isAction = "actionID" in item;
    const itemId = isAction
      ? (item as Action).actionID
      : (item as Test).testID;

    // Capture updated item outside setPlan
    let updatedItemCopy: Test | Action | null = null;
    let shouldUpdateSelected = false;

    setPlan((prevPlan) => {
      const newPlan = produce(prevPlan, (draft) => {
        if (!isAction) {
          // Toggle Test
          const test = draft.testPlan.find((t: Test) => t.testID === itemId);
          if (test) {
            test.isEnabled = test.isEnabled === false ? true : false;
          }
        } else {
          // Toggle Action
          for (const test of draft.testPlan) {
            if (!test.testActions) continue;
            const action = test.testActions.find(
              (a: Action) => a.actionID === itemId,
            );
            if (action) {
              action.isEnabled = action.isEnabled === false ? true : false;
              break;
            }
          }
        }
      });

      // Find the updated item from the NEW (non-proxy) state
      let updatedItem: Test | Action | null = null;
      if (!isAction) {
        updatedItem = newPlan.testPlan.find((t) => t.testID === itemId) || null;
      } else {
        for (const test of newPlan.testPlan) {
          if (!test.testActions) continue;
          const action = test.testActions.find((a) => a.actionID === itemId);
          if (action) {
            updatedItem = action;
            break;
          }
        }
      }

      // Check if we should update selectedItem
      if (updatedItem) {
        shouldUpdateSelected = !isAction
          ? (selectedItem as Test)?.testID === itemId
          : (selectedItem as Action)?.actionID === itemId;

        if (shouldUpdateSelected) {
          // Create a plain copy to ensure no proxy references
          updatedItemCopy = JSON.parse(JSON.stringify(updatedItem));
        }
      }

      return newPlan;
    });

    // Update selectedItem synchronously after setPlan
    if (shouldUpdateSelected && updatedItemCopy) {
      setSelectedItem(updatedItemCopy);
    }
    setIsDirty(true);
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
    handleAddProfile,
    handleUpdateProfile,
    handleDeleteProfile,
  };
}
