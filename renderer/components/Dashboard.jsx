import React, { useState, useEffect } from 'react'
import { Plus, FolderOpen, Search, MoreVertical, Trash, FileText, Settings as SettingsIcon, Loader2, CheckCircle2 } from 'lucide-react'
import TestPlanService from '@/services/TestPlanService'
import { setTestPlansFldrPath } from '@/appSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from '@/components/ui/textarea'

export default function Dashboard({ onNavigate }) {
  const [plans, setPlans] = useState([])
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newPlanTitle, setNewPlanTitle] = useState('')
  const [newPlanDesc, setNewPlanDesc] = useState('')

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editPlanTitle, setEditPlanTitle] = useState('')
  const [editPlanDesc, setEditPlanDesc] = useState('')
  const [editingFilename, setEditingFilename] = useState(null)

  const [isBackendOnline, setIsBackendOnline] = useState(false)

  useEffect(() => {
    loadPlans()
    checkBackendStatus()
  }, [])

  const checkBackendStatus = async () => {
    const check = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000)

        const res = await fetch('http://localhost:5000/api/status', {
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (res.ok) {
          setIsBackendOnline(true)
          return true
        }
      } catch (e) {
        // Ignore error, backend not ready yet
      }
      return false
    }

    // Initial check
    if (await check()) return

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      const online = await check()
      if (online) {
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }

  const loadPlans = async () => {
    // Check if folder is set
    const folder = await TestPlanService.getFolderPath()
    if (!folder) {
      // If no folder, we might want to prompt or just show empty state
      // For now, let's try to pick if not set, similar to original logic
      // But maybe better to let user click "Open"
    } else {
      const p = await TestPlanService.getPlans()
      setPlans(p)
    }
  }

  const handleOpenFolder = async () => {
    const res = await window.api.pickFolder()
    if (!res.canceled && res.filePaths.length > 0) {
      setTestPlansFldrPath(res.filePaths[0])
      loadPlans()
    }
  }

  const handleCreatePlan = async () => {
    if (!newPlanTitle.trim()) {
      alert("Title is required")
      return
    }
    try {
      await TestPlanService.createPlan(newPlanTitle, newPlanDesc)
      setIsCreateOpen(false)
      setNewPlanTitle('')
      setNewPlanDesc('')
      loadPlans()
    } catch (err) {
      alert("Error creating plan: " + err.message)
    }
  }

  const handleEditClick = (e, plan) => {
    e.stopPropagation()
    setEditingFilename(plan.__filename)
    setEditPlanTitle(plan.title)
    setEditPlanDesc(plan.description)
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editPlanTitle.trim()) {
      alert("Title is required")
      return
    }
    try {
      await TestPlanService.updatePlan(editingFilename, {
        title: editPlanTitle,
        description: editPlanDesc
      })
      setIsEditOpen(false)
      setEditingFilename(null)
      setEditPlanTitle('')
      setEditPlanDesc('')
      loadPlans()
    } catch (err) {
      alert("Error updating plan: " + err.message)
    }
  }

  const handleDeletePlan = async (e, filename) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this plan?")) {
      try {
        await TestPlanService.deletePlan(filename)
        loadPlans()
      } catch (err) {
        alert("Error deleting plan: " + err.message)
      }
    }
  }

  const filteredPlans = plans.filter(p =>
    (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6 space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Create Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Test Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Test Plan</DialogTitle>
                <DialogDescription>
                  Enter the details for the new test plan.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="title" className="text-sm font-medium">Title</label>
                  <Input
                    id="title"
                    value={newPlanTitle}
                    onChange={(e) => setNewPlanTitle(e.target.value)}
                    placeholder="Enter plan title"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="desc" className="text-sm font-medium">Description</label>
                  <Textarea
                    id="desc"
                    value={newPlanDesc}
                    onChange={(e) => setNewPlanDesc(e.target.value)}
                    placeholder="Enter description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreatePlan}>Create Plan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Test Plan</DialogTitle>
                <DialogDescription>
                  Update the details for this test plan.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="edit-title" className="text-sm font-medium">Title</label>
                  <Input
                    id="edit-title"
                    value={editPlanTitle}
                    onChange={(e) => setEditPlanTitle(e.target.value)}
                    placeholder="Enter plan title"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="edit-desc" className="text-sm font-medium">Description</label>
                  <Textarea
                    id="edit-desc"
                    value={editPlanDesc}
                    onChange={(e) => setEditPlanDesc(e.target.value)}
                    placeholder="Enter description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="secondary" onClick={handleOpenFolder}>
            <FolderOpen className="mr-2 h-4 w-4" /> Open Test Plan
          </Button>

          {/* Backend Status Indicator */}
          <div className="flex items-center gap-2 ml-2 px-3 py-1.5 rounded-full bg-muted/50 border text-xs font-medium transition-all duration-500">
            {isBackendOnline ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-green-600">Backend Online</span>
              </>
            ) : (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Connecting to backend...</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plans..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button variant="ghost" size="icon" onClick={() => onNavigate('settings')}>
            <SettingsIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlans.map((plan) => (
          <Card
            key={plan.__filename}
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => onNavigate('plan', plan.__filename)}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold truncate pr-4" title={plan.title}>
                {plan.title}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => handleEditClick(e, plan)}
                  >
                    <FileText className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => handleDeletePlan(e, plan.__filename)}
                  >
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
                {new Date(plan.updated || plan.created).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}
              </div>
            </CardFooter>
          </Card>
        ))}
        {filteredPlans.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No test plans found. Create one or open a folder.
          </div>
        )}
      </div>
    </div>
  )
}
