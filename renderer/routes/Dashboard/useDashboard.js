// routes/Dashboard/useDashboard.js
// Dashboard business logic hook (View-Controller pattern per ADR)

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlanCacheStore } from '@/stores/usePlanCacheStore'
import * as TestPlanAdapter from '@/core/adapters/TestPlanAdapter'
import { setTestPlansFldrPath } from '@/core/ipc/appSettings'

export function useDashboard() {
  const navigate = useNavigate()
  const { plans, setPlans } = usePlanCacheStore()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true)
      const folder = await TestPlanAdapter.getFolderPath()
      if (folder) {
        const p = await TestPlanAdapter.getPlans()
        setPlans(p)
      }
    } catch (error) {
      console.error("Failed to load plans", error)
    } finally {
      setLoading(false)
    }
  }, [setPlans])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const handleOpenFolder = useCallback(async () => {
    const res = await window.api.pickFolder()
    if (!res.canceled && res.filePaths.length > 0) {
      await setTestPlansFldrPath(res.filePaths[0])
      loadPlans()
    }
  }, [loadPlans])

  const handleOpenPlan = useCallback((filename) => {
    navigate(`/plan/${encodeURIComponent(filename)}`)
  }, [navigate])

  const handleDeletePlan = useCallback(async (filename) => {
    if (!confirm('Are you sure you want to delete this test plan?')) return
    try {
      await TestPlanAdapter.deletePlan(filename)
      loadPlans() // Reload after delete
    } catch (error) {
      console.error('Failed to delete plan:', error)
    }
  }, [loadPlans])

  const handleCreatePlan = useCallback(async (title, description) => {
    try {
      const newPlan = await TestPlanAdapter.createPlan(title || 'New Test Plan', description || '')
      loadPlans() // Reload to show new plan
      navigate(`/plan/${encodeURIComponent(newPlan.__filename)}`) // Open the new plan
    } catch (error) {
      console.error('Failed to create plan:', error)
    }
  }, [loadPlans, navigate])

  const handleEditPlan = useCallback(async (filename, { title, description }) => {
    try {
      await TestPlanAdapter.updatePlan(filename, { title, description })
      loadPlans() // Reload to show updated plan
    } catch (error) {
      console.error('Failed to update plan:', error)
    }
  }, [loadPlans])

  const filteredPlans = plans.filter(p =>
    (p.title || '').toLowerCase().includes(search.toLowerCase())
  )

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
    loadPlans
  }
}
