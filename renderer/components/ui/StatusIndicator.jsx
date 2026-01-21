import React, { useState } from 'react'
import { Play, Loader2, CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const StatusIndicator = ({ status, onRun, className, iconClassName }) => {
  const [isHovered, setIsHovered] = useState(false)

  // Determine what to show
  // If running, always show spinner (ignore hover)
  // If hovered, show Play button
  // Else show status icon (or Play if idle)

  const isRunning = status === 'Running...'

  if (isRunning) {
    return (
      <div
        className={cn("flex items-center justify-center p-2", className)}
        role="status"
        aria-label="Running..."
      >
        <Loader2 className={cn("animate-spin text-blue-500", iconClassName)} />
      </div>
    )
  }

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          onRun?.()
        }}
        className={cn(
          "transition-all duration-200",
          // If hovered, we want to look like a standard run button
          // If not hovered and has status, we might want different styling or just the icon
          isHovered ? "opacity-100" : (status ? "opacity-100 hover:bg-transparent" : "opacity-100")
        )}
        title={isHovered ? "Run" : (status || "Run")}
        aria-label={status ? `Run (Status: ${status})` : "Run"}
      >
        {isHovered ? (
          <Play className={cn("fill-current text-white", iconClassName)} />
        ) : (
          (() => {
            switch (status) {
              case 'Success':
                return <CircleCheck className={cn("text-emerald-500", iconClassName)} />
              case 'Failed':
              case 'Error':
                return <CircleX className={cn("text-red-500", iconClassName)} />
              case 'Warning':
                return <TriangleAlert className={cn("text-yellow-500", iconClassName)} />
              default: // Idle or unknown
                return <Play className={cn("fill-current text-emerald-500", iconClassName)} />
            }
          })()
        )}
      </Button>
    </div>
  )
}
