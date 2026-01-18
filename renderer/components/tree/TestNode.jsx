import React from 'react'
import { GripVertical, ChevronRight, ChevronDown, Play, Plus, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusIndicator } from '@/components/ui/StatusIndicator'
import { Draggable, Droppable } from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'
import ActionNode from './ActionNode'

const TestNode = React.memo(function TestNode({
  test,
  index,
  isExpanded,
  onToggleExpand,
  selectedItem,
  onSelect,
  onEdit,
  onAddAction,
  onDeleteTest,
  onDeleteAction,
  onRunTest,
  onRunAction,
  onToggleEnabled,
  logs = {} // Add logs prop
}) {
  const isSelected = selectedItem === test
  const isChildSelected = test.testActions?.some(a => a?.actionID === selectedItem?.actionID)
  const isActiveContext = isSelected || isChildSelected

  const handleAddActionClick = (e) => {
    e.stopPropagation()
    onAddAction(test)
  }

  return (
    <Draggable draggableId={test.testID} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn("group mb-2", snapshot.isDragging && "opacity-50")}
        >
          {/* Test Header */}
          <div
            className={cn(
              "flex items-center p-2 rounded-lg border transition-colors duration-200",
              // Highlight if selected OR if a child is selected
              isActiveContext
                ? "bg-emerald-950/40 border-emerald-500/50"
                : "bg-card/50 border-transparent hover:bg-emerald-950/20 hover:border-emerald-500/20"
            )}
            onClick={(e) => {
              if (!isExpanded) onToggleExpand(test.testID)
              onSelect(test)
            }}
          >
            {/* Drag Handle */}
            <div
              {...provided.dragHandleProps}
              className="mr-2 cursor-grab text-muted-foreground/50 hover:text-foreground outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(test.testID); }}
              className="mr-2 p-0.5 rounded-sm hover:bg-muted/50 text-muted-foreground"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {/* Circular Checkbox */}
            <div
              className={cn(
                "mr-3 h-5 w-5 rounded-full border flex items-center justify-center transition-colors cursor-pointer",
                test.isEnabled !== false
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "border-muted-foreground/50 bg-transparent"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleEnabled(test);
              }}
            >
              {test.isEnabled !== false && <Check className="h-3 w-3 stroke-[3]" />}
            </div>

            <span
              className="font-medium text-sm truncate flex-1 text-foreground/90 select-none"
              onClick={(e) => { e.stopPropagation(); onSelect(test); }}
            >
              {test.testTitle}
            </span>

            <div className="flex items-center ml-auto gap-1 transition-opacity">
              <StatusIndicator
                status={test.status} // Will be computed in parent or passed down
                onRun={() => onRunTest && onRunTest(test)}
                className="h-7 w-7"
                iconClassName="h-3.5 w-3.5"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleAddActionClick}
                title="Add Action"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteTest(test.testID)
                }}
                title="Delete Test"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Expanded Actions List */}
          {isExpanded && (
            <Droppable droppableId={test.testID} type="ACTION">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "min-h-[10px] pl-4 pr-1 pb-1 mt-1 rounded-b-lg ml-4 border-l-2 transition-colors duration-300",
                    isActiveContext ? "border-emerald-500/30 bg-emerald-950/10" : "border-border/30"
                  )}
                >
                  <div className="pt-2 space-y-1">
                    {test.testActions && test.testActions.map((action, idx) => (
                      <ActionNode
                        key={action.actionID}
                        action={{ ...action, status: logs[action.actionID]?.status }} // Pass status
                        index={idx}
                        selectedItem={selectedItem}
                        onRunAction={onRunAction}
                        onSelect={onSelect}
                        onEdit={onEdit}
                        onDeleteAction={onDeleteAction}
                        onToggleEnabled={onToggleEnabled}
                      />
                    ))}
                    {provided.placeholder}
                    {(!test.testActions || test.testActions.length === 0) && (
                      <div className="text-xs text-muted-foreground italic py-1 pl-2">No actions (drag detailed action to add)</div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  )
})

export default TestNode
