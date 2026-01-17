import React from 'react'
import { Plus, ChevronRight, ChevronDown, GripVertical, Trash2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function TestTree({
  testPlan,
  selectedItem,
  onSelect,
  onEdit,
  onAddTest,
  onAddAction,
  onReorderTests,
  onReorderActions,
  onDeleteTest,
  onDeleteAction,
  onRunTest,
  onRunAction
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const [expandedTestIds, setExpandedTestIds] = React.useState([])
  const knownIds = React.useRef(new Set())

  React.useEffect(() => {
    if (!testPlan) return
    const currentIds = testPlan.map(t => t.testID)
    const newIds = currentIds.filter(id => !knownIds.current.has(id))

    if (newIds.length > 0) {
      setExpandedTestIds(prev => [...prev, ...newIds])
      newIds.forEach(id => knownIds.current.add(id))
    }
  }, [testPlan])

  const handleDragStart = (event) => {
    const { active } = event
    if (active.id.toString().startsWith('T')) {
      setExpandedTestIds([])
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const isTest = active.id.toString().startsWith('T')
      const isAction = active.id.toString().startsWith('A')

      if (isTest) {
        onReorderTests(active.id, over.id)
      } else if (isAction) {
        onReorderActions(active.id, over.id)
      }
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-2 p-2">
        <SortableContext
          items={testPlan.map(t => t.testID)}
          strategy={verticalListSortingStrategy}
        >
          {testPlan.map((test, index) => (
            <TestNode
              key={test.testID || index}
              test={test}
              isExpanded={expandedTestIds.includes(test.testID)}
              onToggleExpand={() => {
                setExpandedTestIds(prev =>
                  prev.includes(test.testID)
                    ? prev.filter(id => id !== test.testID)
                    : [...prev, test.testID]
                )
              }}
              selectedItem={selectedItem}
              onSelect={onSelect}
              onEdit={onEdit}
              onAddAction={onAddAction}
              onReorderActions={onReorderActions}
              onDeleteTest={onDeleteTest}
              onDeleteAction={onDeleteAction}
              onRunTest={onRunTest}
              onRunAction={onRunAction}
            />
          ))}
        </SortableContext>
        <Button variant="secondary" className="w-full mt-4" onClick={onAddTest}>
          <Plus className="mr-2 h-4 w-4" /> Add Test
        </Button>
      </div>
    </DndContext>
  )
}

function TestNode({ test, isExpanded, onToggleExpand, selectedItem, onSelect, onEdit, onAddAction, onReorderActions, onDeleteTest, onDeleteAction, onRunTest, onRunAction }) {
  const isSelected = selectedItem === test

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: test.testID })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.95 : 1,
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : undefined,
  }

  const handleTitleChange = (e) => {
    test.testTitle = e.target.value
    onEdit()
  }

  const handleAddActionClick = (e) => {
    e.stopPropagation()
    onAddAction(test)
  }

  // Ensure actions have IDs for DnD
  // If not, we can't easily sort them. 
  // We will handle Action sorting if they have IDs. 
  // For now, let's skip Action sorting in this step if they lack IDs, or map them.
  const actionIds = test.testActions ? test.testActions.map((a, i) => a.actionID || `action-${test.testID}-${i}`) : []

  return (
    <div ref={setNodeRef} style={style} className={cn("border-l-[6px] border-l-emerald-500 border rounded-md bg-card transition-colors mb-3 shadow-sm", isSelected && "ring-2 ring-emerald-500")}>
      <div
        className="flex items-center p-2 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-t-md cursor-pointer group border-b border-emerald-500/10"
        onClick={(e) => {
          onToggleExpand()
          onSelect(test)
        }}
      >
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="mr-2 cursor-grab opacity-0 group-hover:opacity-100 hover:text-primary" onClick={(e) => e.stopPropagation()}>
          <GripVertical className="h-4 w-4" />
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          className="p-1 mr-2 hover:bg-accent rounded"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <input
          type="checkbox"
          checked={test.isEnabled !== false}
          onChange={(e) => {
            test.isEnabled = e.target.checked
            onEdit()
          }}
          onClick={(e) => e.stopPropagation()}
          className="mr-2 h-4 w-4 rounded border-primary text-primary focus:ring-primary"
        />

        <Input
          value={test.testTitle}
          onChange={handleTitleChange}
          onFocus={() => onSelect(test)}
          className="h-7 px-2 py-1 font-medium border-transparent hover:border-input focus:border-input bg-transparent"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex items-center ml-auto gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
            onClick={(e) => {
              e.stopPropagation()
              onRunTest && onRunTest(test)
            }}
            title="Run Test"
          >
            <Play className="h-4 w-4 fill-current" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleAddActionClick}
            title="Add Action"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteTest(test.testID)
            }}
            title="Delete Test"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="pl-8 pr-2 pb-2 space-y-1 relative">
          {/* Vertical Line connecting actions */}
          <div className="absolute left-6 top-0 bottom-2 w-px bg-foreground/20" />
          <SortableContext items={actionIds} strategy={verticalListSortingStrategy}>
            {test.testActions && test.testActions.map((action, idx) => (
              <ActionNode
                key={action.actionID || idx}
                id={action.actionID || `action-${test.testID}-${idx}`}
                action={action}
                selectedItem={selectedItem}
                onRunAction={onRunAction}
                onSelect={onSelect}
                onEdit={onEdit}
                onDeleteAction={onDeleteAction}
              />
            ))}
          </SortableContext>
          {(!test.testActions || test.testActions.length === 0) && (
            <div className="text-xs text-muted-foreground italic py-1 pl-2">No actions</div>
          )}
        </div>
      )}
    </div>
  )
}

function ActionNode({ id, action, selectedItem, onSelect, onEdit, onDeleteAction, onRunAction }) {
  const isSelected = selectedItem === action

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.95 : 1,
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : undefined,
    backgroundColor: isDragging ? 'hsl(var(--background))' : undefined,
  }

  const handleTitleChange = (e) => {
    action.actionTitle = e.target.value
    onEdit()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex items-center p-2 my-1 rounded text-sm cursor-pointer border-l-[4px] border-l-amber-500 border border-transparent group ml-2 transition-colors",
        "hover:bg-amber-500/10",
        isSelected && "bg-amber-500/20 border-amber-500/50"
      )}
      onClick={() => onSelect(action)}
    >
      {/* Horizontal Line Connector */}
      <div className="absolute -left-4 top-1/2 w-4 h-px bg-foreground/20" />

      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="mr-2 cursor-grab opacity-0 group-hover:opacity-100 hover:text-primary z-10" onClick={(e) => e.stopPropagation()}>
        <GripVertical className="h-3 w-3" />
      </div>

      <input
        type="checkbox"
        checked={action.isEnabled !== false}
        onChange={(e) => {
          action.isEnabled = e.target.checked
          onEdit()
        }}
        onClick={(e) => e.stopPropagation()}
        className="mr-2 h-3 w-3 rounded border-primary text-primary focus:ring-primary"
      />

      <Input
        value={action.actionTitle}
        onChange={handleTitleChange}
        onFocus={() => onSelect(action)}
        className="h-6 px-1 py-0 text-sm border-transparent hover:border-input focus:border-input bg-transparent flex-1"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex items-center ml-auto gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
          onClick={(e) => {
            e.stopPropagation()
            onRunAction && onRunAction(action)
          }}
          title="Run Action"
        >
          <Play className="h-3 w-3 fill-current" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation()
            onDeleteAction(action.actionID)
          }}
          title="Delete Action"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
