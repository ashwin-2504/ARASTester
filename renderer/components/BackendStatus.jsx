import React, { useState, useEffect } from 'react';
import { Loader2, Server, Globe, WifiOff } from 'lucide-react';
import { apiClient } from '@/core/api/client';
import { cn } from '@/lib/utils';

export function BackendStatus({ className }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'online' | 'offline'

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await apiClient.get('/api/status');
        setStatus('online');
      } catch (err) {
        setStatus('offline');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10s for better responsiveness
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground animate-pulse", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Connecting to ARAS Services...</span>
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-destructive font-medium", className)}>
        <WifiOff className="h-3 w-3" />
        <span>ARAS Services Offline</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 text-[10px] text-emerald-500 font-semibold tracking-wider uppercase", className)}>
      <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      <span>ARAS Connectors Online</span>
    </div>
  );
}
