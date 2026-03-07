import { Check, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BufferedInput } from './BufferedInput'
import JsonViewer from '@/components/JsonViewer'
import { actionRegistry } from '@/core/registries/ActionRegistry'
import actionSchemas from '@/core/schemas/action-schemas.json'
import type { Action } from '@/types/plan'
import type { ExecutionLog } from '../hooks/usePlanExecution'

interface ActionEditorPanelProps {
  action: Action;
  onUpdate: (updates: Partial<Action>) => void;
  logs: Record<string, ExecutionLog>;
}

export const ActionEditorPanel = ({
  action,
  onUpdate,
  logs
}: ActionEditorPanelProps) => {
  const currentCatId = actionSchemas.actions.find(a => a.type === action.actionType)?.category || actionSchemas.categories[0].id
  const currentCategory = actionSchemas.categories.find(c => c.id === currentCatId) || actionSchemas.categories[0]
  const currentAction = actionSchemas.actions.find(a => a.type === action.actionType)
  const plugin = actionRegistry.get(action.actionType)

  return (
    <>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Action Title</label>
        <BufferedInput
          value={action.actionTitle}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ actionTitle: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Action Type</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between rounded-md border border-input bg-background/50 hover:bg-accent/50 hover:text-accent-foreground px-4 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
                  <span className="flex items-center gap-2 truncate">
                    <span>{currentCategory.icon}</span>
                    <span>{currentCategory.label}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px]" align="start">
                {actionSchemas.categories.map(c => (
                  <DropdownMenuItem
                    key={c.id}
                    onSelect={() => {
                      const firstAction = actionSchemas.actions.find(a => a.category === c.id)
                      if (firstAction) {
                        const plugin = actionRegistry.get(firstAction.type)
                        onUpdate({
                          actionType: firstAction.type,
                          params: plugin ? JSON.parse(JSON.stringify(plugin.defaultParams)) : {}
                        })
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-muted-foreground">{c.icon}</span>
                    {c.label}
                    {currentCatId === c.id && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1 relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between rounded-md border border-input bg-background/50 hover:bg-accent/50 hover:text-accent-foreground px-4 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
                  <span className="truncate">{currentAction?.label || "Select Action"}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px]" align="start">
                <ScrollArea className="h-auto max-h-[300px]">
                  {actionSchemas.actions
                    .filter(a => a.category === currentCatId)
                    .map(a => (
                      <DropdownMenuItem
                        key={a.type}
                        onSelect={() => {
                          const plugin = actionRegistry.get(a.type)
                          onUpdate({
                            actionType: a.type,
                            params: plugin ? JSON.parse(JSON.stringify(plugin.defaultParams)) : {}
                          })
                        }}
                      >
                        {a.label}
                        {action.actionType === a.type && <Check className="ml-auto h-4 w-4" />}
                      </DropdownMenuItem>
                    ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {plugin?.Editor && (
        <div className="mt-4 rounded-lg border bg-muted/20 p-4 space-y-4">
          <plugin.Editor
            params={action.params || {}}
            onChange={(newParams: Record<string, unknown>) => onUpdate({ params: newParams })}
          />
        </div>
      )}

      {action.actionID && logs[action.actionID] && (
        <div className="pt-6 border-t mt-6">
          <h3 className="text-sm font-semibold mb-3">Execution Log</h3>
          <div className="bg-muted/30 p-4 rounded-md text-sm font-mono">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${logs[action.actionID].status === 'Success' ? 'bg-emerald-500/20 text-emerald-500' :
                ['Failed', 'Error'].includes(logs[action.actionID].status) ? 'bg-red-500/20 text-red-500' :
                  'bg-blue-500/20 text-blue-500'
                }`}>
                {logs[action.actionID].status}
              </span>
              <span className="text-xs text-muted-foreground">
                {(() => {
                  const d = new Date(logs[action.actionID].timestamp)
                  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()} ${d.toLocaleTimeString()}`
                })()}
              </span>
            </div>
            <JsonViewer data={logs[action.actionID].details} />
          </div>
        </div>
      )}
    </>
  )
}
