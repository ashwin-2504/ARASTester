// hooks/useConfirmDialog.ts
import { create } from 'zustand'

/**
 * State for a promise-based confirmation dialog.
 */
interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

interface ConfirmState {
  isOpen: boolean
  options: ConfirmOptions | null
  resolve: ((value: boolean) => void) | null
  confirm: (options: ConfirmOptions) => Promise<boolean>
  onConfirm: () => void
  onCancel: () => void
}

/**
 * A hook that provides a promise-based confirmation dialog.
 */
export const useConfirmDialog = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: null,
  resolve: null,
  confirm: (options) => {
    return new Promise((resolve) => {
      const activeResolve = get().resolve;
      if (activeResolve) {
        // Single-flight behavior: resolve the previous pending dialog as "cancelled".
        activeResolve(false);
      }

      set({
        isOpen: true,
        options,
        resolve,
      })
    })
  },
  onConfirm: () => {
    const { resolve } = get()
    if (resolve) resolve(true)
    set({ isOpen: false, options: null, resolve: null })
  },
  onCancel: () => {
    const { resolve } = get()
    if (resolve) resolve(false)
    set({ isOpen: false, options: null, resolve: null })
  },
}))

/**
 * Functional wrapper for the confirm hook to match the usage in the components.
 */
export const confirm = (options: ConfirmOptions): Promise<boolean> => {
  return useConfirmDialog.getState().confirm(options)
}
