import { useNavigate } from '@tanstack/react-router'
import { useTabs } from '../contexts/tab-context'
import { RxCross2 } from 'react-icons/rx'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Tab } from '../stores/tab-store'

interface SortableTabProps {
  tab: Tab
  isActive: boolean
  onClose: (id: string) => void
  onSelect: (id: string, path: string) => void
}

function SortableTab({ tab, isActive, onClose, onSelect }: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center group min-w-30 max-w-60 border-r border-border transition-colors cursor-pointer select-none ${
        isActive 
          ? 'bg-background border-b-2 border-b-primary hover:bg-muted/50' 
          : 'hover:bg-muted'
      }`}
      onClick={() => onSelect(tab.id, tab.path)}
    >
      <div
        className={`flex-1 px-3 py-2 text-sm truncate text-left ${
          isActive ? 'font-medium text-primary' : 'text-muted-foreground'
        }`}
      >
        {tab.title}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose(tab.id)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="px-2 py-1 mr-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        <RxCross2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function TabBar() {
  const { tabs, activeTabId, closeTab, setActiveTabId, reorderTabs } = useTabs()
  const navigate = useNavigate()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Only show tab bar when there are 2+ tabs
  if (tabs.length <= 1) return null

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex((t) => t.id === active.id)
      const newIndex = tabs.findIndex((t) => t.id === over.id)
      reorderTabs(oldIndex, newIndex)
    }
  }

  const handleSelect = (id: string, path: string) => {
    if (id !== activeTabId) {
      setActiveTabId(id)
      navigate({ to: path as any })
    }
  }

  const handleClose = (id: string) => {
    closeTab(id)
    if (tabs.length === 1) {
      navigate({ to: '/library' })
    }
  }

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tabs.map((t) => t.id)}
          strategy={horizontalListSortingStrategy}
        >
          {tabs.map((tab) => (
            <SortableTab
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onClose={handleClose}
              onSelect={handleSelect}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}
