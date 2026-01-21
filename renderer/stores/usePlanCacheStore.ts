import { create } from "zustand";
import type { TestPlan } from "@/types/plan";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface PlanCacheState {
  plans: TestPlan[];
  lastFetchedAt: number | null;
  setPlans: (plans: TestPlan[]) => void;
  clearPlans: () => void;
  isStale: () => boolean;
  invalidate: () => void;
  updatePlan: (filename: string, updates: Partial<TestPlan>) => void;
  removePlan: (filename: string) => void;
}

export const usePlanCacheStore = create<PlanCacheState>((set, get) => ({
  plans: [],
  lastFetchedAt: null,

  setPlans: (plans) =>
    set({
      plans,
      lastFetchedAt: Date.now(),
    }),

  clearPlans: () =>
    set({
      plans: [],
      lastFetchedAt: null,
    }),

  // Check if cache is stale
  isStale: () => {
    const { lastFetchedAt } = get();
    if (!lastFetchedAt) return true;
    return Date.now() - lastFetchedAt > CACHE_TTL_MS;
  },

  // Invalidate cache (force next fetch to reload)
  invalidate: () => set({ lastFetchedAt: null }),

  // Update a single plan in cache
  updatePlan: (filename, updates) =>
    set((state) => ({
      plans: state.plans.map((p) =>
        p.__filename === filename ? { ...p, ...updates } : p,
      ),
    })),

  // Remove a plan from cache
  removePlan: (filename) =>
    set((state) => ({
      plans: state.plans.filter((p) => p.__filename !== filename),
    })),
}));
