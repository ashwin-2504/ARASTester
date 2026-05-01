// routes/Dashboard/useDashboard.ts
// Dashboard business logic hook (View-Controller pattern per ADR)

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanCacheStore } from "@/stores/usePlanCacheStore";
import * as TestPlanAdapter from "@/core/adapters/TestPlanAdapter";
import { setTestPlansFldrPath } from "@/core/ipc/appSettings";
import { confirm } from "@/lib/hooks/useConfirmDialog";


export function useDashboard() {
  const navigate = useNavigate();
  const { plans, setPlans, updatePlan, removePlan, isStale } = usePlanCacheStore();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPlans = useCallback(async (force = false) => {
    if (!force && plans.length > 0 && !isStale()) return;

    try {
      setLoading(true);
      const folder = await TestPlanAdapter.getFolderPath();
      if (folder) {
        const p = await TestPlanAdapter.getPlans();
        // Ensure the adapter returns compatible TestPlan objects
        setPlans(p);
      }
    } catch (error) {
      console.error("Failed to load plans", error);
    } finally {
      setLoading(false);
    }
  }, [isStale, plans.length, setPlans]);

  useEffect(() => {
    loadPlans(false);
  }, [loadPlans]);

  const handleOpenFolder = useCallback(async () => {
    const res = await window.api.pickFolder();
    if (!res.canceled && res.filePaths.length > 0) {
      await setTestPlansFldrPath(res.filePaths[0]);
      loadPlans(true);
    }
  }, [loadPlans]);

  const handleOpenPlan = useCallback(
    (filename: string) => {
      navigate(`/plan/${encodeURIComponent(filename)}`);
    },
    [navigate],
  );

  const handleDeletePlan = useCallback(
    async (filename: string) => {
      const confirmed = await confirm({
        title: "Delete Test Plan",
        description: "Are you sure you want to delete this test plan?",
        confirmText: "Delete",
        variant: "destructive",
      });
      if (!confirmed) return;

      try {
        await TestPlanAdapter.deletePlan(filename);
        removePlan(filename);
      } catch (error) {
        console.error("Failed to delete plan:", error);
      }
    },
    [removePlan],
  );

  const handleCreatePlan = useCallback(
    async (title: string, description: string) => {
      try {
        const newPlan = await TestPlanAdapter.createPlan(
          title || "New Test Plan",
          description || "",
        );
        if (newPlan?.__filename) {
          const currentPlans = usePlanCacheStore.getState().plans;
          setPlans([newPlan, ...currentPlans.filter((p) => p.__filename !== newPlan.__filename)]);
        } else {
          loadPlans(true);
        }
        if (newPlan && newPlan.__filename) {
          navigate(`/plan/${encodeURIComponent(newPlan.__filename)}`); // Open the new plan
        }
      } catch (error) {
        console.error("Failed to create plan:", error);
      }
    },
    [loadPlans, navigate, setPlans],
  );

  const handleEditPlan = useCallback(
    async (filename: string, { title, description }: { title: string; description: string }) => {
      try {
        const updated = await TestPlanAdapter.updatePlan(filename, { title, description });
        if (updated) {
          updatePlan(filename, updated);
        } else {
          updatePlan(filename, { title, description });
        }
      } catch (error) {
        console.error("Failed to update plan:", error);
      }
    },
    [updatePlan],
  );

  const filteredPlans = plans.filter((p) =>
    (p.title || "").toLowerCase().includes(search.toLowerCase()),
  );

  return {
    // State
    plans: filteredPlans,
    search,
    loading,
    // Actions
    setSearch,
    handleOpenFolder,
    handleOpenPlan,
    handleDeletePlan,
    handleCreatePlan,
    handleEditPlan,
    loadPlans,
  };
}
