import { useState, useEffect } from 'react';
import { Loader2, WifiOff } from 'lucide-react';
import { apiClient } from '@/core/api/client';
import { cn } from '@/lib/utils';

interface BackendStatusProps {
  className?: string;
}

export function BackendStatus({ className }: BackendStatusProps) {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let failureCount = 0;
    const baseDelayMs = 10000;
    const maxDelayMs = 60000;

    const checkStatus = async () => {
      try {
        await apiClient.get('/api/status');
        if (!isMounted) return;
        failureCount = 0;
        setStatus('online');
      } catch {
        if (!isMounted) return;
        failureCount += 1;
        setStatus('offline');
      }
    };

    const scheduleNext = () => {
      if (!isMounted || document.hidden) return;
      const backoff = Math.min(baseDelayMs * (2 ** Math.min(failureCount, 3)), maxDelayMs);
      timeoutId = setTimeout(() => {
        void checkStatus().then(scheduleNext);
      }, backoff);
    };

    const handleVisibilityChange = () => {
      if (!isMounted) return;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!document.hidden) {
        void checkStatus().then(scheduleNext);
      }
    };

    if (!document.hidden) {
      void checkStatus().then(scheduleNext);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className={cn("app-inline-status app-inline-status--info animate-pulse", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Connecting to ARAS Services...</span>
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div className={cn("app-inline-status app-inline-status--error", className)}>
        <WifiOff className="h-3 w-3" />
        <span>ARAS Services Offline</span>
      </div>
    );
  }

  return (
    <div className={cn("app-inline-status app-inline-status--success", className)}>
      <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_10px_rgba(81,196,140,0.5)]" />
      <span>ARAS Connectors Online</span>
    </div>
  );
}
