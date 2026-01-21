import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx' // Explicit extension for non-migrated component
import { DragDropContext, Droppable, DropResult, DragStart } from '@hello-pangea/dnd'
import TestNode from './tree/TestNode'
import type { Test, Action } from '@/types/plan'

interface TestTreeProps {
  testPlan: Test[];
  selectedItem: Test | Action | null;
  onSelect: (item: Test | Action) => void;
  onEdit?: (item: Test | Action) => void;
  onAddTest: () => void;
  onAddAction: (test: Test) => void;
  onMoveTest: (fromIndex: number, toIndex: number) => void;
  onMoveAction: (sourceTestId: string, fromIndex: number, destTestId: string, toIndex: number) => void;
  onDeleteTest: (id: string) => void;
  onDeleteAction: (id: string) => void;
  onRunTest: (test: Test) => void;
  onRunAction: (action: Action) => void;
  onToggleEnabled: (item: Test | Action) => void;
  logs?: Record<string, any>;
}

export default function TestTree({
  testPlan,
  selectedItem,
  onSelect,
  onEdit,
  onAddTest,
  onAddAction,
  onMoveTest,
  onMoveAction,
  onDeleteTest,
  onDeleteAction,
  onRunTest,
  onRunAction,
  onToggleEnabled,
  logs = {} // Add logs prop
}: TestTreeProps) {
  const [expandedTestIds, setExpandedTestIds] = React.useState<string[]>([])
  const hasInitialized = React.useRef(false)

  React.useEffect(() => {
    if (testPlan && testPlan.length > 0 && !hasInitialized.current) {
      setExpandedTestIds(testPlan.map(t => t.testID))
      hasInitialized.current = true
    }
  }, [testPlan])

  const handleToggleExpand = React.useCallback((testID: string) => {
    setExpandedTestIds(prev =>
      prev.includes(testID)
        ? prev.filter(id => id !== testID)
        : [...prev, testID]
    )
  }, [])

  const [draggingType, setDraggingType] = React.useState<string | null>(null)

  // Auto-expand/collapse based on drag type
  React.useEffect(() => {
    if (!testPlan) return;
    
    if (draggingType === 'ACTION') {
      // Expand all when dragging actions to allow dropping anywhere
      setExpandedTestIds(testPlan.map(t => t.testID));
    } else if (draggingType === 'TEST') {
      // Collapse all when dragging tests to make reordering easier
      setExpandedTestIds([]);
    }
  }, [draggingType, testPlan]);

  const onDragStart = (start: DragStart) => {
    setDraggingType(start.type)
  }

  const onDragEnd = (result: DropResult) => {
    setDraggingType(null)
    const { source, destination, type } = result;

    if (!destination) return;

    // Handle drops on the header droppable (auto-expanded headers)
    // Map them to the test's main list
    let destDroppableId = destination.droppableId
    if (destDroppableId.startsWith("toggle-droppable-")) {
      destDroppableId = destDroppableId.replace("toggle-droppable-", "")
    }

    // Dropped in same position
    if (
      source.droppableId === destDroppableId &&
      source.index === destination.index
    ) return;

    if (type === 'TEST') {
      onMoveTest(source.index, destination.index);
    } else if (type === 'ACTION') {
      onMoveAction(
        source.droppableId, // Source Test ID
        source.index,
        destDroppableId, // Dest Test ID (mapped)
        destination.index
      );
    }
  }

  // Helper to compute test status
  const getTestStatus = (test: Test): string | null => {
    const actions = test.testActions || []
    if (actions.length === 0) return null

    // If any action is running -> Running
    if (actions.some(a => logs[a.actionID]?.status === 'Running...')) return 'Running...'

    // If ANY enabled action failed -> Failed
    if (actions.some(a => a.isEnabled !== false && ['Failed', 'Error'].includes(logs[a.actionID]?.status))) return 'Failed'

    // If ALL enabled actions are Success -> Success
    const enabledActions = actions.filter(a => a.isEnabled !== false)
    if (enabledActions.length > 0 && enabledActions.every(a => logs[a.actionID]?.status === 'Success')) return 'Success'

    // If any enabled action is Warning -> Warning
    if (actions.some(a => a.isEnabled !== false && logs[a.actionID]?.status === 'Warning')) return 'Warning'

    return null
  }

  if (!testPlan || testPlan.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No tests defined.
        <Button variant="outline" className="mt-4 w-full" onClick={onAddTest}>
          <Plus className="mr-2 h-4 w-4" /> Add Test
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-2">
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <Droppable droppableId="test-list" type="TEST">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {testPlan.map((test, index) => {
                return (
                  <TestNode
                    key={test.testID || index}
                    test={{ ...test, status: getTestStatus(test) || undefined }} // Pass computed status
                    index={index}
                    isExpanded={expandedTestIds.includes(test.testID)}
                    onToggleExpand={handleToggleExpand}
                    selectedItem={selectedItem}
                    onSelect={onSelect}
                    onEdit={onEdit}
                    onAddAction={onAddAction}
                    onDeleteTest={onDeleteTest}
                    onDeleteAction={onDeleteAction}
                    onRunTest={onRunTest}
                    onRunAction={onRunAction}
                    onToggleEnabled={onToggleEnabled}
                    logs={logs} // Pass logs down
                    draggingType={draggingType}
                  />
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button variant="ghost" className="w-full mt-4 border-2 border-dashed border-muted-foreground/20 text-muted-foreground hover:bg-transparent hover:text-muted-foreground hover:border-muted-foreground/20" onClick={onAddTest}>
        <Plus className="mr-2 h-4 w-4" /> Add Test
      </Button>
    </div>
  )
}
