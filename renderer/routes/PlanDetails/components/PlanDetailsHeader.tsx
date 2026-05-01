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
    <header className="flex min-h-[5.5rem] flex-none min-w-0 flex-col justify-between gap-4 border-b border-border/80 bg-panel/70 px-5 py-4 backdrop-blur md:flex-row md:items-center md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          onClick={onBack}
          className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 space-y-1">
          <div className="app-section-label">Plan Editor</div>
          <h1 className="truncate text-2xl font-semibold tracking-tight" title={title || filename}>
            {title || filename}
          </h1>
        </div>
      </div>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-3 whitespace-nowrap">
        {saveStatus && <span className="app-inline-status app-inline-status--success">{saveStatus}</span>}
        <Button
          variant="outline"
          className="border-success/40 text-success hover:bg-success/10 hover:text-success"
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
