import { useEffect, useCallback } from "react";
import { apiClient } from "@/core/api/client";
import { confirm } from "@/lib/hooks/useConfirmDialog";
import { usePlanState } from "./hooks/usePlanState";
import { usePlanExecution } from "./hooks/usePlanExecution";
import { usePlanSelection } from "./hooks/usePlanSelection";
import type { Test, Action } from "@/types/plan";

export function usePlanDetails(filename: string, _onNavigate?: (path: string) => void) {
  const requestPrefix = `plan-details:${filename}:`;

  const {
    plan, loading, error, isDirty, saveStatus,
    loadPlan, handleSave, addTest, addAction, deleteTest, deleteAction, 
    updateItem, reorderTests, moveAction,
    addProfile, updateProfile, deleteProfile
  } = usePlanState(filename);

  const {
    selectedItem, setSelectedItem
  } = usePlanSelection(plan);

  const {
    logs, isRunning, initializingTestId, runTest, runAll, runAction
  } = usePlanExecution(plan, undefined, requestPrefix);

  useEffect(() => {
    // Cleanup only requests that belong to this screen.
    return () => {
      apiClient.cancelByPrefix(requestPrefix);
    };
  }, [requestPrefix]);

  const handleAddTest = useCallback(() => {
    const newTest = addTest();
    setSelectedItem(newTest);
  }, [addTest, setSelectedItem]);

  const handleAddAction = useCallback((test: Test) => {
    const newAction = addAction(test.testID);
    setSelectedItem(newAction);
  }, [addAction, setSelectedItem]);

  const handleDeleteTest = useCallback(async (testId: string) => {
    const confirmed = await confirm({
      title: "Delete Test",
      description: "Delete this test and all its actions?",
      confirmText: "Delete",
      variant: "destructive",
    });
    if (confirmed) {
      deleteTest(testId);
      if (selectedItem && 'testID' in selectedItem && selectedItem.testID === testId) {
        setSelectedItem(null);
      }
    }
  }, [deleteTest, selectedItem, setSelectedItem]);

  const handleDeleteAction = useCallback(async (actionId: string) => {
    const confirmed = await confirm({
      title: "Delete Action",
      description: "Delete this action?",
      confirmText: "Delete",
      variant: "destructive",
    });
    if (confirmed) {
      deleteAction(actionId);
      if (selectedItem && 'actionID' in selectedItem && selectedItem.actionID === actionId) {
        setSelectedItem(null);
      }
    }
  }, [deleteAction, selectedItem, setSelectedItem]);

  const handleToggleEnabled = useCallback((item: Test | Action) => {
    const id = 'testID' in item ? item.testID : item.actionID;
    const nextEnabled = item.isEnabled === false; // Toggle
    updateItem(id, { isEnabled: nextEnabled });
    
    // Sync selection
    if (selectedItem) {
        const sId = 'testID' in selectedItem ? selectedItem.testID : selectedItem.actionID;
        if (sId === id) {
            setSelectedItem({ ...selectedItem, isEnabled: nextEnabled } as Test | Action);
        }
    }
  }, [updateItem, selectedItem, setSelectedItem]);

  const handleRunAll = useCallback(async () => {
    if (isDirty) await handleSave();
    await runAll();
  }, [isDirty, handleSave, runAll]);

  const handleUpdateSelectedItem = useCallback((updates: Partial<Test> | Partial<Action>) => {
    if (!selectedItem) return;
    const id = 'testID' in selectedItem ? selectedItem.testID : selectedItem.actionID;
    updateItem(id, updates);
    
    // Also update local selectedItem state for immediate UI feedback
    setSelectedItem(prev => prev ? ({ ...prev, ...updates } as Test | Action) : null);
  }, [selectedItem, updateItem, setSelectedItem]);

  return {
    plan,
    loading,
    error,
    isDirty,
    saveStatus,
    logs,
    selectedItem,
    initializingTestId,
    isRunning,
    setSelectedItem,
    loadPlan,
    handleSave,
    handleAddTest,
    handleAddAction,
    handleDeleteTest,
    handleDeleteAction,
    handleMoveTest: reorderTests,
    handleMoveAction: moveAction,
    handleRunAll,
    handleRunTest: runTest,
    handleRunAction: runAction,
    updateSelectedItem: handleUpdateSelectedItem,
    handleToggleEnabled,
    handleAddProfile: addProfile,
    handleUpdateProfile: updateProfile,
    handleDeleteProfile: deleteProfile,
  };
}
