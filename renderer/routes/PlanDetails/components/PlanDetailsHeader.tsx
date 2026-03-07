import React from 'react'
import { ChevronLeft, RotateCcw, Save, Play, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlanDetailsHeaderProps {
  title: string;
  filename: string;
  isDirty: boolean;
  isRunning: boolean;
  saveStatus: string;
  onBack: () => void;
  onRunAll: () => void;
  onReload: () => void;
  onSave: () => void;
}

export const PlanDetailsHeader = ({
  title,
  filename,
  isDirty,
  isRunning,
  saveStatus,
  onBack,
  onRunAll,
  onReload,
  onSave
}: PlanDetailsHeaderProps) => {
  return (
    <header className="flex-none h-auto min-h-[4rem] border-b px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center justify-between bg-card/50 min-w-0">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight truncate" title={title || filename}>
          {title || filename}
        </h1>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 flex-wrap whitespace-nowrap">
        {saveStatus && <span className="text-sm text-emerald-500 font-medium whitespace-nowrap">{saveStatus}</span>}
        <Button
          variant="outline"
          className="text-emerald-500 border-emerald-500 hover:bg-emerald-500/10 whitespace-nowrap"
          onClick={onRunAll}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2 fill-current" /> Run All
            </>
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={onReload} className="flex-shrink-0">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button onClick={onSave} disabled={!isDirty} className="flex-shrink-0">
          <Save className="h-4 w-4 mr-2" /> Save
        </Button>
      </div>
    </header>
  )
}
