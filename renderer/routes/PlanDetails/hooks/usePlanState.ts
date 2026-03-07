import { useState, useCallback, useEffect } from "react";
import { produce } from "immer";
import * as TestPlanAdapter from "@/core/adapters/TestPlanAdapter";
import { generateTestId, generateActionId } from "@/lib/idGenerator";
import { actionRegistry } from "@/core/registries/ActionRegistry";
import type { TestPlan, Test, Action, PlanProfile } from "@/types/plan";

export function usePlanState(filename: string) {
  const [plan, setPlan] = useState<TestPlan>({ 
    title: "", 
    created: new Date().toISOString(), 
    updated: new Date().toISOString(), 
    testPlan: [], 
    profiles: [] 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const ensureIds = useCallback((data: TestPlan): TestPlan => {
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
  }, []);

  const loadPlan = useCallback(async () => {
    try {
      setLoading(true);
      const data = await TestPlanAdapter.getPlan(filename);
      setPlan(ensureIds(data));
      setIsDirty(false);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [filename, ensureIds]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleSave = async () => {
    try {
      await TestPlanAdapter.updatePlan(filename, plan as TestPlan);
      setIsDirty(false);
      setSaveStatus("Saved!");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const addTest = useCallback(() => {
    const newTest: Test = {
      testTitle: "New Test",
      testID: generateTestId(),
      isEnabled: true,
      testActions: [],
    };
    setPlan(prev => produce(prev, draft => {
       draft.testPlan.push(newTest);
    }));
    setIsDirty(true);
    return newTest;
  }, []);

  const addAction = useCallback((testId: string) => {
    const defaultType = actionRegistry.getAll()[0]?.type || "Custom";
    const plugin = actionRegistry.get(defaultType);
    const newAction: Action = {
      actionTitle: "New Action",
      actionType: defaultType,
      actionID: generateActionId(),
      isEnabled: true,
      params: plugin ? JSON.parse(JSON.stringify(plugin.defaultParams)) : {},
    };

    setPlan(prev => produce(prev, draft => {
      const idx = draft.testPlan.findIndex(t => t.testID === testId);
      if (idx !== -1) {
        if (!draft.testPlan[idx].testActions) draft.testPlan[idx].testActions = [];
        draft.testPlan[idx].testActions!.push(newAction);
      }
    }));
    setIsDirty(true);
    return newAction;
  }, []);

  const deleteTest = useCallback((testId: string) => {
    setPlan(prev => ({
      ...prev,
      testPlan: prev.testPlan.filter(t => t.testID !== testId)
    }));
    setIsDirty(true);
  }, []);

  const deleteAction = useCallback((actionId: string) => {
    setPlan(prev => produce(prev, draft => {
      draft.testPlan.forEach(t => {
        if (t.testActions) {
          t.testActions = t.testActions.filter(a => a.actionID !== actionId);
        }
      });
    }));
    setIsDirty(true);
  }, []);

  const updateItem = useCallback((itemId: string, updates: Partial<Test | Action>) => {
    setPlan(prev => produce(prev, draft => {
      const testIdx = draft.testPlan.findIndex(t => t.testID === itemId);
      if (testIdx !== -1) {
        Object.assign(draft.testPlan[testIdx], updates);
        return;
      }
      for (const test of draft.testPlan) {
        const actionIdx = test.testActions?.findIndex(a => a.actionID === itemId);
        if (actionIdx !== undefined && actionIdx !== -1) {
          Object.assign(test.testActions![actionIdx], updates);
          return;
        }
      }
    }));
    setIsDirty(true);
  }, []);

  const reorderTests = useCallback((sourceIndex: number, destIndex: number) => {
    setPlan(prev => {
      const next = [...prev.testPlan];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(destIndex, 0, moved);
      return { ...prev, testPlan: next };
    });
    setIsDirty(true);
  }, []);

  const moveAction = useCallback((sId: string, sIdx: number, dId: string, dIdx: number) => {
    setPlan(produce(draft => {
      const sT = draft.testPlan.find(t => t.testID === sId);
      const dT = draft.testPlan.find(t => t.testID === dId);
      if (!sT || !dT || !sT.testActions) return;
      const [moved] = sT.testActions.splice(sIdx, 1);
      if (!moved) return;
      if (!dT.testActions) dT.testActions = [];
      dT.testActions.splice(dIdx, 0, moved);
    }));
    setIsDirty(true);
  }, []);

  const addProfile = useCallback((profile: PlanProfile) => {
    setPlan(prev => produce(prev, draft => {
       if (!draft.profiles) draft.profiles = [];
       draft.profiles.push(profile);
    }));
    setIsDirty(true);
  }, []);

  const updateProfile = useCallback((id: string, updates: Partial<PlanProfile>) => {
    setPlan(prev => produce(prev, draft => {
      const profile = draft.profiles?.find(p => p.id === id);
      if (profile) Object.assign(profile, updates);
    }));
    setIsDirty(true);
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setPlan(prev => produce(prev, draft => {
      if (draft.profiles) {
        draft.profiles = draft.profiles.filter(p => p.id !== id);
      }
    }));
    setIsDirty(true);
  }, []);

  return {
    plan, setPlan, loading, error, isDirty, setIsDirty, saveStatus,
    loadPlan, handleSave, addTest, addAction, deleteTest, deleteAction, 
    updateItem, reorderTests, moveAction,
    addProfile, updateProfile, deleteProfile
  };
}
