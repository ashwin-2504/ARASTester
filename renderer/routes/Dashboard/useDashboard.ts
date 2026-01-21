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
  const { plans, setPlans } = usePlanCacheStore();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPlans = useCallback(async () => {
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
  }, [setPlans]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleOpenFolder = useCallback(async () => {
    const res = await window.api.pickFolder();
    if (!res.canceled && res.filePaths.length > 0) {
      await setTestPlansFldrPath(res.filePaths[0]);
      loadPlans();
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
        loadPlans(); // Reload after delete
      } catch (error) {
        console.error("Failed to delete plan:", error);
      }
    },
    [loadPlans],
  );

  const handleCreatePlan = useCallback(
    async (title: string, description: string) => {
      try {
        const newPlan = await TestPlanAdapter.createPlan(
          title || "New Test Plan",
          description || "",
        );
        loadPlans(); // Reload to show new plan
        if (newPlan && newPlan.__filename) {
          navigate(`/plan/${encodeURIComponent(newPlan.__filename)}`); // Open the new plan
        }
      } catch (error) {
        console.error("Failed to create plan:", error);
      }
    },
    [loadPlans, navigate],
  );

  const handleEditPlan = useCallback(
    async (filename: string, { title, description }: { title: string; description: string }) => {
      try {
        await TestPlanAdapter.updatePlan(filename, { title, description });
        loadPlans(); // Reload to show updated plan
      } catch (error) {
        console.error("Failed to update plan:", error);
      }
    },
    [loadPlans],
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
