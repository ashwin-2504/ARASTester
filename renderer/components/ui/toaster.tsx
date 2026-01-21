import { useToast } from '@/lib/hooks/use-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[420px] w-full pointer-events-none p-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
            toast.variant === 'destructive' 
              ? "destructive group border-destructive bg-destructive text-destructive-foreground" 
              : "bg-background text-foreground border-border"
          )}
        >
          <div className="grid gap-1">
             {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
             {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className={cn(
              "absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
              toast.variant === "destructive" ? "text-red-300 hover:text-red-50 focus:ring-red-400 focus:ring-offset-red-600" : "text-foreground/50 hover:text-foreground"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
