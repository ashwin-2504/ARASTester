import { useState, type MouseEvent } from 'react'
import { Plus, FolderOpen, Search, MoreVertical, Trash, FileText, Settings as SettingsIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card.jsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDashboard } from './useDashboard'
import PlanModal from '@/components/PlanModal.jsx'
import { BackendStatus } from '@/components/BackendStatus'
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
    <div className="app-page">
      <div className="app-page-inner animate-in fade-in duration-500 pb-24">
        <div className="app-page-header">
          <div className="min-w-0 space-y-2">
            <div className="app-section-label">Workspace</div>
            <h1 className="app-page-title">Dashboard</h1>
            <BackendStatus />
          </div>

          <div className="flex w-full min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center md:w-auto">
            <div className="relative w-full sm:max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans..."
                className="h-11 w-full pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-shrink-0 items-center gap-3 whitespace-nowrap">
              <Button variant="outline" onClick={() => { void handleOpenFolder() }} className="h-11">
                <FolderOpen className="mr-2 h-4 w-4" /> Open Folder
              </Button>

              <Button onClick={openCreateModal} className="h-11 px-5 whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" /> New Plan
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/settings')}
                className="h-11 w-11 flex-shrink-0"
              >
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="app-empty-state min-h-[320px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5">
            {plans.map((plan) => (
              <Card
                key={plan.__filename}
                className="app-card-interactive group relative cursor-pointer"
                onClick={(event: MouseEvent) => {
                  if (event.defaultPrevented) return
                  handleOpenPlan(plan.__filename || "")
                }}
              >
                <CardHeader className="flex flex-row items-start justify-between p-5 space-y-0">
                  <CardTitle className="truncate pr-4 text-base font-semibold leading-tight text-foreground">
                    {plan.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                      }}
                    >
                      <Button variant="ghost" className="-mr-2 -mt-1 h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          openEditModal(plan)
                        }}
                        onSelect={(event) => {
                          event.preventDefault()
                          openEditModal(plan)
                        }}
                        className="cursor-pointer"
                      >
                        <FileText className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          void handleDeletePlan(plan.__filename || "")
                        }}
                        onSelect={(event) => {
                          event.preventDefault()
                          void handleDeletePlan(plan.__filename || "")
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>

                <CardContent className="px-5 pb-5 pt-0">
                  <p className="h-[60px] line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {plan.description || "No description provided for this test plan."}
                  </p>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-border/70 bg-panelMuted px-5 py-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 transition-colors group-hover:bg-primary" />
                    {new Date(plan.updated || plan.created).toLocaleDateString()}
                  </div>
                </CardFooter>
              </Card>
            ))}

            {/* Empty State */}
            {plans.length === 0 && (
              <div className="app-empty-state col-span-full space-y-4">
                <div className="rounded-2xl border border-border/80 bg-panelMuted p-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p>No plans found. Create a new one to get started.</p>
                <Button onClick={openCreateModal} variant="outline">
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
