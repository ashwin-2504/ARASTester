import { useState, useCallback } from "react";
import type { Test, Action, TestPlan } from "@/types/plan";

export function usePlanSelection(plan: TestPlan) {
  const [selectedItem, setSelectedItem] = useState<Test | Action | null>(null);

  const selectItemById = useCallback((id: string | null) => {
    if (!id) {
        setSelectedItem(null);
        return;
    }

    // Attempt to find the item in current plan to ensure we have fresh reference
    const test = plan.testPlan.find(t => t.testID === id);
    if (test) {
        setSelectedItem(test);
        return;
    }

    for (const t of plan.testPlan) {
        const action = t.testActions?.find(a => a.actionID === id);
        if (action) {
            setSelectedItem(action);
            return;
        }
    }
  }, [plan]);

  // Sync selection when plan changes (optional helper)
  const refreshSelection = useCallback(() => {
    if (!selectedItem) return;
    const id = 'testID' in selectedItem ? selectedItem.testID : selectedItem.actionID;
    selectItemById(id);
  }, [selectedItem, selectItemById]);

  return {
    selectedItem,
    setSelectedItem,
    selectItemById,
    refreshSelection
  };
}
