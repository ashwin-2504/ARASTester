import React, { useState } from 'react'
import { Plus, FolderOpen, Search, MoreVertical, Trash, FileText, Settings as SettingsIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card.jsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx"
import { useDashboard } from './useDashboard'
import PlanModal from '@/components/PlanModal.jsx'
import { BackendStatus } from '@/components/BackendStatus.jsx'
import { useNavigate } from 'react-router-dom'
import type { TestPlan } from "@/types/plan"

export default function DashboardPage() {
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

  const navigate = useNavigate()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<TestPlan | null>(null)

  const openCreateModal = () => {
    setEditingPlan(null)
    setIsModalOpen(true)
  }

  const openEditModal = (plan: TestPlan) => {
    setEditingPlan(plan)
    setIsModalOpen(true)
  }

  const handleModalSave = async ({ title, description }: { title: string; description: string }) => {
    if (editingPlan && editingPlan.__filename) {
      // Edit existing plan
      await handleEditPlan(editingPlan.__filename, { title, description })
    } else {
      // Create new plan
      await handleCreatePlan(title, description)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-950/50">
      <div className="container mx-auto p-8 space-y-8 animate-in fade-in duration-500 pb-24">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
            <BackendStatus />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans..."
                className="pl-9 bg-[#1c1c1f] border-zinc-800 text-sm h-10 focus-visible:ring-indigo-500"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              onClick={handleOpenFolder}
              className="bg-[#1c1c1f] border-zinc-800 hover:bg-zinc-800 hover:text-white h-10"
            >
              <FolderOpen className="mr-2 h-4 w-4" /> Open Folder
            </Button>

            <Button
              onClick={openCreateModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 h-10 px-6 font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)]"
            >
              <Plus className="mr-2 h-4 w-4" /> New Plan
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-10 w-10"
            >
              <SettingsIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {plans.map((plan) => (
              <Card
                key={plan.__filename}
                className="group relative bg-[#1c1c1f] border-zinc-800/50 hover:border-indigo-500/50 cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(79,70,229,0.1)] hover:-translate-y-1"
                onClick={() => handleOpenPlan(plan.__filename || "")}
              >
                <CardHeader className="flex flex-row items-start justify-between p-5 space-y-0">
                  <CardTitle className="text-base font-semibold text-zinc-100 truncate pr-4 leading-tight">
                    {plan.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e: any) => e.stopPropagation()}>
                      <Button variant="ghost" className="h-6 w-6 p-0 text-zinc-500 hover:text-white hover:bg-transparent -mt-1 -mr-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1c1c1f] border-zinc-800 text-zinc-300">
                      <DropdownMenuItem onClick={(e: any) => { e.stopPropagation(); openEditModal(plan) }} className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 focus:bg-red-900/10 focus:text-red-400 cursor-pointer" onClick={(e: any) => { e.stopPropagation(); handleDeletePlan(plan.__filename || "") }}>
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>

                <CardContent className="px-5 pb-5 pt-0">
                  <p className="text-sm text-zinc-500 line-clamp-3 h-[60px] leading-relaxed">
                    {plan.description || "No description provided for this test plan."}
                  </p>
                </CardContent>

                <CardFooter className="px-5 py-4 border-t border-zinc-800/50 bg-[#161619] text-xs text-zinc-500 flex items-center justify-between">
                  {/* Date Section */}
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-indigo-500 transition-colors" />
                    {new Date(plan.updated || plan.created).toLocaleDateString()}
                  </div>
                </CardFooter>
              </Card>
            ))}

            {/* Empty State */}
            {plans.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-20 text-muted-foreground border border-dashed border-zinc-800 bg-[#1c1c1f]/50 rounded-xl space-y-4">
                <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
                  <FileText className="h-8 w-8 text-zinc-500" />
                </div>
                <p>No plans found. Create a new one to get started.</p>
                <Button onClick={openCreateModal} variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                  Create First Plan
                </Button>
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
    </div>
  )
}
