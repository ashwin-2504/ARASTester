import { create } from 'zustand'

export const usePlanCacheStore = create((set) => ({
  plans: [],
  setPlans: (plans) => set({ plans }),
  clearPlans: () => set({ plans: [] })
}))
