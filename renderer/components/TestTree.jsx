import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'
import TestNode from './tree/TestNode'

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
  onToggleEnabled
}) {
  const [expandedTestIds, setExpandedTestIds] = React.useState([])
  const knownIds = React.useRef(new Set())

  const handleToggleExpand = React.useCallback((testID) => {
    setExpandedTestIds(prev =>
      prev.includes(testID)
        ? prev.filter(id => id !== testID)
        : [...prev, testID]
    )
  }, [])

  const onDragEnd = (result) => {
    const { source, destination, type } = result;

    if (!destination) return;

    // Dropped in same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    if (type === 'TEST') {
      onMoveTest(source.index, destination.index);
    } else if (type === 'ACTION') {
      onMoveAction(
        source.droppableId, // Source Test ID
        source.index,
        destination.droppableId, // Dest Test ID
        destination.index
      );
    }
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
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="test-list" type="TEST">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {testPlan.map((test, index) => (
                <TestNode
                  key={test.testID || index}
                  test={test}
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
                />
              ))}
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
