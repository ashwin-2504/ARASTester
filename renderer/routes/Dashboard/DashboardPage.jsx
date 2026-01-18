import React, { useState } from 'react'
import { Plus, FolderOpen, Search, MoreVertical, Trash, FileText, Settings as SettingsIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDashboard } from './useDashboard'
import PlanModal from '@/components/PlanModal'

export default function DashboardPage({ onOpenSettings }) {
  const {
    plans,
    search,
    loading,
    setSearch,
    handleOpenFolder,
    handleOpenPlan,
    handleDeletePlan,
    handleCreatePlan,
    handleEditPlan
  } = useDashboard()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)

  const openCreateModal = () => {
    setEditingPlan(null)
    setIsModalOpen(true)
  }

  const openEditModal = (plan) => {
    setEditingPlan(plan)
    setIsModalOpen(true)
  }

  const handleModalSave = async ({ title, description }) => {
    if (editingPlan) {
      // Edit existing plan
      await handleEditPlan(editingPlan.__filename, { title, description })
    } else {
      // Create new plan
      await handleCreatePlan(title, description)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleOpenFolder}>
            <FolderOpen className="mr-2 h-4 w-4" /> Open Folder
          </Button>
          <Button onClick={openCreateModal}>
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
          {plans.map((plan) => (
            <Card
              key={plan.__filename}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleOpenPlan(plan.__filename)}
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
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditModal(plan) }}>
                      <FileText className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.__filename) }}>
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
          {plans.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              No plans found. Open a folder or create a new plan.
            </div>
          )}
        </div>
      )}

      {/* Plan Create/Edit Modal */}
      <PlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        plan={editingPlan}
      />
    </div>
  )
}
