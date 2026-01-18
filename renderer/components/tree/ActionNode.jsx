import React from 'react'
import { GripVertical, Play, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusIndicator } from '@/components/ui/StatusIndicator'
import { Draggable } from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'

const ActionNode = React.memo(function ActionNode({
  action,
  index,
  selectedItem,
  onSelect,
  onEdit,
  onDeleteAction,
  onRunAction,
  onToggleEnabled
}) {
  const isSelected = selectedItem === action

  return (
    <Draggable draggableId={action.actionID} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={provided.draggableProps.style}
          className={cn(
            "group flex items-center p-2 rounded-lg border transition-colors duration-200 relative mb-1",
            isSelected
              ? "bg-amber-950/40 border-amber-500/50"
              : "bg-card/30 border-transparent hover:bg-amber-950/20 hover:border-amber-500/20",
            snapshot.isDragging && "opacity-90 shadow-lg ring-1 ring-amber-500/50"
          )}
          onClick={() => onSelect(action)}
        >
          {/* Horizontal Line Connector - Only show if not dragging */}
          {!snapshot.isDragging && (
            <div className="absolute -left-4 top-1/2 w-4 h-px bg-border/40" />
          )}

          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            className="mr-2 cursor-grab text-muted-foreground/50 hover:text-foreground outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Circular Checkbox */}
          <div
            className={cn(
              "mr-3 h-4 w-4 rounded-full border flex items-center justify-center transition-colors cursor-pointer",
              action.isEnabled !== false
                ? "bg-blue-500 border-blue-500 text-white"
                : "border-muted-foreground/50 bg-transparent"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggleEnabled(action);
            }}
          >
            {action.isEnabled !== false && <Check className="h-2.5 w-2.5 stroke-[3]" />}
          </div>

          <span
            className="text-sm truncate flex-1 text-foreground/90 select-none"
            onClick={(e) => { e.stopPropagation(); onSelect(action); }}
          >
            {action.actionTitle}
          </span>
          <div className="flex items-center ml-auto gap-1 transition-opacity">
            <StatusIndicator
              status={action.status} // Will be passed from parent
              onRun={() => onRunAction && onRunAction(action)}
              className="h-6 w-6"
              iconClassName="h-3 w-3"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteAction(action.actionID)
              }}
              title="Delete Action"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Draggable>
  )
})

export default ActionNode
