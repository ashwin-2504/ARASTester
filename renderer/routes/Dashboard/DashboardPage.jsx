import React, { useEffect, useState } from 'react'
import { Plus, FolderOpen, Search, MoreVertical, Trash, FileText, Settings as SettingsIcon, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { usePlanCacheStore } from '@/stores/usePlanCacheStore'
import TestPlanService from '@/services/TestPlanService'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardPage({ onOpenSettings }) {
  const navigate = useNavigate()
  const { plans, setPlans } = usePlanCacheStore()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // NOTE: This logic will move to useDashboard.js in the next step to fully adhere to "View-Controller" pattern.
  // For this initial migration step, I am co-locating it to get the route rendering first, 
  // then I will extract the hook as per the plan "Migrate Dashboard logic to routes/Dashboard/useDashboard.js".

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const folder = await TestPlanService.getFolderPath()
      if (folder) {
        const p = await TestPlanService.getPlans()
        setPlans(p)
      }
    } catch (error) {
      console.error("Failed to load plans", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenFolder = async () => {
    // In a real refactor, we'd import { setTestPlansFldrPath } from '@/appSettings' 
    // but strictly we should use the service. 
    // Current Dashboard.jsx imported it directly. 
    // For now, let's replicate the functionality.
    const res = await window.api.pickFolder()
    if (!res.canceled && res.filePaths.length > 0) {
      // We need a way to set the path. 
      // In the original, it imported setTestPlansFldrPath.
      // We will need to keep that import or expose it via Service.
      // I will assume for now we can import it or move logic to Service.
      // Let's stick closer to the Service pattern if possible, but for direct port:
      const { setTestPlansFldrPath } = await import('@/appSettings')
      setTestPlansFldrPath(res.filePaths[0])
      loadPlans()
    }
  }

  const filteredPlans = plans.filter(p =>
    (p.title || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleOpenFolder}>
            <FolderOpen className="mr-2 h-4 w-4" /> Open Folder
          </Button>
          <Button onClick={() => alert("Create Dialog would open here")}>
            <Plus className="mr-2 h-4 w-4" /> New Plan
          </Button>
          <Button variant="ghost" size="icon" onClick={onOpenSettings}>
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search plans..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => (
            <Card
              key={plan.__filename}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/plan/${encodeURIComponent(plan.__filename)}`)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold truncate pr-4">
                  {plan.title}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* edit */ }}>
                      <FileText className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); /* delete */ }}>
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                  {plan.description || "No description provided."}
                </p>
              </CardContent>
              <CardFooter>
                <div className="flex items-center text-xs text-muted-foreground">
                  <FileText className="mr-1 h-3 w-3" />
                  {new Date(plan.updated || plan.created).toLocaleString()}
                </div>
              </CardFooter>
            </Card>
          ))}
          {filteredPlans.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              No plans found. Open a folder or create a new plan.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
