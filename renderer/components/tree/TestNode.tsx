import React from 'react'
import { GripVertical, ChevronRight, ChevronDown, Plus, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { StatusIndicator } from '@/components/ui/StatusIndicator.jsx'
import { Draggable, Droppable } from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'
import ActionNode from './ActionNode'
import type { Test, Action } from '@/types/plan'

interface TestNodeProps {
  test: Test & { status?: string };
  index: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  selectedItem: Test | Action | null;
  onSelect: (item: Test | Action) => void;
  onEdit?: (item: Test | Action) => void;
  onAddAction: (test: Test) => void;
  onDeleteTest: (id: string) => void;
  onDeleteAction: (id: string) => void;
  onRunTest: (test: Test) => void;
  onRunAction: (action: Action) => void;
  onToggleEnabled: (item: Test | Action) => void;
  logs?: Record<string, any>;
  draggingType?: string | null;
}

const TestNode = React.memo<TestNodeProps>(function TestNode({
  test,
  index,
  isExpanded,
  onToggleExpand,
  selectedItem,
  onSelect,
  // onEdit, // unused
  onAddAction,
  onDeleteTest,
  onDeleteAction,
  onRunTest,
  onRunAction,
  onToggleEnabled,
  logs = {},
  draggingType // Received prop
}) {
  const isSelected = selectedItem && 'testID' in selectedItem && selectedItem.testID === test.testID
  const isChildSelected = test.testActions?.some(a => selectedItem && 'actionID' in selectedItem && a?.actionID === selectedItem.actionID)
  const isActiveContext = isSelected || isChildSelected

  const handleAddActionClick = (e: React.MouseEvent) => {
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
            onClick={(_e: React.MouseEvent) => {
              if (!isExpanded) onToggleExpand(test.testID)
              onSelect(test)
            }}
          >
            {/* Drag Handle */}
            <div
              {...provided.dragHandleProps}
              className="mr-2 cursor-grab text-muted-foreground/50 hover:text-foreground outline-none"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </div>

            <button
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onToggleExpand(test.testID); }}
              className="mr-2 p-0.5 rounded-sm hover:bg-muted/50 text-muted-foreground"
              aria-label={isExpanded ? "Collapse Test" : "Expand Test"}
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
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onToggleEnabled(test);
              }}
              title={test.isEnabled !== false ? "Disable Test" : "Enable Test"}
            >
              {test.isEnabled !== false && <Check className="h-3 w-3 stroke-[3]" />}
            </div>

            <span
              className="font-medium text-sm truncate flex-1 text-foreground/90 select-none"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onSelect(test); }}
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
                aria-label="Add Action"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  onDeleteTest(test.testID)
                }}
                title="Delete Test"
                aria-label="Delete Test"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Actions List Area */}
          <Droppable droppableId={test.testID} type="ACTION">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "pl-4 pr-1 ml-4 border-l-2 transition-all duration-300 ease-in-out",
                  isActiveContext ? "border-emerald-500/30 bg-emerald-950/10" : "border-border/30",
                  // New Logic:
                  // If expanded: Show full list (normal styles)
                  // If collapsed BUT dragging action: Show small drop hint (h-10)
                  // If collapsed and NOT dragging: Hide (h-0, overflow-hidden)
                  isExpanded
                    ? "min-h-[10px] pb-1 mt-1 rounded-b-lg opacity-100"
                    : (draggingType === 'ACTION' && snapshot.isDraggingOver)
                      ? "h-12 border-2 border-dashed border-emerald-500/50 mt-1 rounded opacity-100 bg-emerald-500/10"
                      : (draggingType === 'ACTION')
                        ? "h-2 mt-0.5 border-none opacity-50 bg-emerald-500/20" // Thin landing strip hint
                        : "h-0 py-0 mt-0 border-0 opacity-0 overflow-hidden"
                )}
              >
                {/* Render content only if expanded OR if we need structure for the drop */}
                {/* Actually, react-beautiful-dnd needs the placeholders. */}
                {/* We should just toggle visibility of the list items */}

                <div className={cn("pt-2 space-y-1", !isExpanded && "hidden")}>
                  {test.testActions && test.testActions.map((action, idx) => (
                    <ActionNode
                      key={action.actionID}
                      action={{ ...action, status: logs[action.actionID]?.status }}
                      index={idx}
                      selectedItem={selectedItem}
                      onRunAction={onRunAction}
                      onSelect={onSelect}
                      // onEdit={onEdit}
                      onDeleteAction={onDeleteAction}
                      onToggleEnabled={onToggleEnabled}
                    />
                  ))}
                </div>

                {provided.placeholder}

                {/* Empty state or Drop Hint */}
                {isExpanded && (!test.testActions || test.testActions.length === 0) && (
                  <div className="text-xs text-muted-foreground italic py-1 pl-2">No actions (drag detailed action to add)</div>
                )}
                {!isExpanded && draggingType === 'ACTION' && snapshot.isDraggingOver && (
                  <div className="flex items-center justify-center h-full text-xs text-emerald-500 font-medium">
                    Drop to Add
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>
      )
      }
    </Draggable >
  )
})

export default TestNode
