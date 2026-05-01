import * as React from "react"

import { AppIcon, type AppIconProps } from "@/components/ui/icon"

type CompatIconConfig = {
  name: string
  filled?: boolean
  spin?: boolean
  defaultSize?: AppIconProps["size"]
}

export type LucideProps = Omit<AppIconProps, "name">

function inferIconSize(className?: string): AppIconProps["size"] | undefined {
  if (!className) return undefined

  if (/\bh-(3|3\.5)\b|\bw-(3|3\.5)\b/.test(className)) return "xs"
  if (/\bh-4\b|\bw-4\b/.test(className)) return "sm"
  if (/\bh-5\b|\bw-5\b/.test(className)) return "md"
  if (/\bh-6\b|\bw-6\b/.test(className)) return "lg"
  if (/\bh-8\b|\bw-8\b/.test(className)) return "xl"
  if (/\bh-10\b|\bw-10\b/.test(className)) return "2xl"

  return undefined
}

function createCompatIcon({ name, filled = false, spin = false, defaultSize = "md" }: CompatIconConfig) {
  const CompatIcon = React.forwardRef<HTMLSpanElement, LucideProps>(
    ({ className, size, ...props }, ref) => (
      <AppIcon
        ref={ref}
        name={name}
        filled={filled}
        spin={spin}
        size={size ?? inferIconSize(className) ?? defaultSize}
        className={className}
        {...props}
      />
    ),
  )

  CompatIcon.displayName = name
  return CompatIcon
}

export const AlertCircle = createCompatIcon({ name: "error" })
export const ArrowLeft = createCompatIcon({ name: "arrow_back" })
export const Check = createCompatIcon({ name: "check", defaultSize: "sm" })
export const ChevronDown = createCompatIcon({ name: "keyboard_arrow_down" })
export const ChevronLeft = createCompatIcon({ name: "arrow_back_ios_new" })
export const ChevronRight = createCompatIcon({ name: "chevron_right" })
export const Circle = createCompatIcon({ name: "fiber_manual_record", filled: true, defaultSize: "xs" })
export const CircleCheck = createCompatIcon({ name: "task_alt" })
export const CircleX = createCompatIcon({ name: "cancel" })
export const Copy = createCompatIcon({ name: "content_copy" })
export const Database = createCompatIcon({ name: "storage" })
export const FileText = createCompatIcon({ name: "description" })
export const FolderOpen = createCompatIcon({ name: "folder_open" })
export const GripVertical = createCompatIcon({ name: "drag_indicator" })
export const Loader2 = createCompatIcon({ name: "progress_activity", spin: true })
export const MoreVertical = createCompatIcon({ name: "more_vert" })
export const Play = createCompatIcon({ name: "play_arrow", filled: true })
export const Plus = createCompatIcon({ name: "add" })
export const RotateCcw = createCompatIcon({ name: "refresh" })
export const Save = createCompatIcon({ name: "save" })
export const Search = createCompatIcon({ name: "search" })
export const Settings = createCompatIcon({ name: "settings" })
export const TriangleAlert = createCompatIcon({ name: "warning" })
export const Trash = createCompatIcon({ name: "delete" })
export const Trash2 = createCompatIcon({ name: "delete" })
export const Users = createCompatIcon({ name: "groups" })
export const Wifi = createCompatIcon({ name: "wifi" })
export const WifiOff = createCompatIcon({ name: "wifi_off" })
export const X = createCompatIcon({ name: "close" })
