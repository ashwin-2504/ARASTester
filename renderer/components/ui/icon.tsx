import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const iconVariants = cva("material-symbols-rounded app-icon", {
  variants: {
    size: {
      xs: "app-icon--xs",
      sm: "app-icon--sm",
      md: "app-icon--md",
      lg: "app-icon--lg",
      xl: "app-icon--xl",
      "2xl": "app-icon--2xl",
    },
    filled: {
      true: "app-icon--filled",
      false: "",
    },
  },
  defaultVariants: {
    size: "md",
    filled: false,
  },
})

export interface AppIconProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iconVariants> {
  name: string
  grade?: number
  opticalSize?: number
  spin?: boolean
}

export const AppIcon = React.forwardRef<HTMLSpanElement, AppIconProps>(
  (
    {
      className,
      name,
      size,
      filled,
      grade = 0,
      opticalSize = 20,
      spin = false,
      style,
      ...props
    },
    ref,
  ) => (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(iconVariants({ size, filled }), spin && "animate-spin", className)}
      style={{
        ...style,
        fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" 400, "GRAD" ${grade}, "opsz" ${opticalSize}`,
      }}
      {...props}
    >
      {name}
    </span>
  ),
)
AppIcon.displayName = "AppIcon"
