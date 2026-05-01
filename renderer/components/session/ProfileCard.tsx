import React, { useState } from "react";
import {
  MoreVertical,
  Copy,
  Wifi,
  Loader2,
} from "lucide-react";
import { SavedSession, useSessionStore } from "@/stores/useSessionStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  session: SavedSession;
  onEdit: (session: SavedSession) => void;
  onDelete?: (session: SavedSession) => void;
}

/**
 * ProfileCard component for saved session profiles.
 *
 * Connect Button Disable Logic:
 * - disabled={isConnecting || !session.password}
 * - Only disables THIS session's button when it is connecting
 * - Other sessions remain clickable
 *
 * Note: Backend currently supports only one active connection.
 * Initiating a new connection while one is pending may override
 * the previous attempt depending on store implementation.
 */
export function ProfileCard({ session, onEdit, onDelete }: ProfileCardProps) {
  const {
    activeSessions,
    login,
    logout,
    isLoading,
    connectingSessions,
    deleteSavedSession,
  } = useSessionStore();
  
  
  const [expanded, setExpanded] = useState(false);

  // Determine status
  const activeSession = activeSessions.find(
    (s) => s.name === session.name // Use session.name as it matches the saved session name usually
  );
  // Also check if this specific session is currently connecting
  const isConnecting = connectingSessions.has(session.sessionName);
  
  const isConnected = !!activeSession;
  
  // Staleness Heuristic
  const STALE_THRESHOLD_MS = 45 * 60 * 1000; // 45 minutes
  let isStale = false;
  let timeAgo = "";

  if (!isConnected && session.lastAccessedAt) {
      const last = new Date(session.lastAccessedAt).getTime();
      const now = new Date().getTime();
      const diff = now - last;
      
      if (diff > STALE_THRESHOLD_MS) {
          isStale = true;
      }
      
      // Simple time ago formatter
      const mins = Math.floor(diff / 60000);
      if (mins < 60) timeAgo = `${mins}m ago`;
      else if (mins < 1440) timeAgo = `${Math.floor(mins / 60)}h ago`;
      else timeAgo = `${Math.floor(mins / 1440)}d ago`;
  }
  
  // Status config
  const statusConfig = isConnecting
    ? { label: "Connecting...", color: "text-blue-500", dot: "bg-blue-500 animate-pulse" }
    : isConnected
    ? { label: "Connected", color: "text-emerald-500", dot: "bg-emerald-500" }
    : isStale
    ? { label: "Stale", color: "text-amber-500", dot: "bg-amber-500" } 
    : { label: "Offline", color: "text-zinc-500", dot: "bg-zinc-500" };

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await login({
      url: session.url,
      database: session.database,
      username: session.username,
      password: session.password || "",
      sessionName: session.sessionName,
    });
  };

  const handleDisconnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await logout(session.sessionName);
  };

  const getInitials = (name: string) => {
    return name
      .split("_")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border transition-all duration-200",
        expanded ? "border-borderStrong bg-panelElevated shadow-panel" : "border-border/70 bg-panel shadow-panel hover:border-borderStrong hover:bg-panelElevated",
        isConnected && !expanded && "border-l-4 border-l-success",
        isConnecting && !expanded && "border-l-4 border-l-info"
      )}
    >
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-sm font-bold text-primary">
            {isConnecting ? <Loader2 className="h-5 w-5 animate-spin" /> : getInitials(session.name)}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {session.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dot)}
              />
              <span className={cn("text-xs font-medium", statusConfig.color)} title={!isConnected && session.lastAccessedAt ? `Last used ${timeAgo}` : undefined}>
                {statusConfig.label} {isStale && !isConnecting && `(${timeAgo})`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button (Icon only when collapsed) */}
        {!expanded && (
          <div className="flex items-center gap-2">
            {!isConnected && !isConnecting ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={handleConnect}
                disabled={isConnecting || !session.password}
                title={!session.password ? "Password required" : "Connect to session"}
              >
                Connect
              </Button>
            ) : isConnecting ? (
                <div className="p-2"><Loader2 className="h-4 w-4 animate-spin text-info" /></div>
            ) : (
             <div className="p-2"> <Wifi className="h-4 w-4 text-success" /></div>
            )}
            <div onClick={(e) => { e.stopPropagation(); setExpanded(true); }}>
              <MoreVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </div>
          </div>
        )}
        
        {expanded && (
             <div className="p-2"> <MoreVertical className="h-4 w-4 rotate-90 text-muted-foreground" /></div>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-1">
          <div className="space-y-3 border-t border-border/70 pt-2">
            <div className="flex items-center justify-between">
                <span className="app-section-label">Credentials</span>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={(e) => { e.stopPropagation(); onEdit(session); }}
                >
                    Edit
                </Button>
            </div>

            <div className="relative group">
              <label className="mb-1 block text-xs text-muted-foreground">Username</label>
              <Input
                readOnly
                value={session.username}
                className="h-10 pr-8 font-mono text-sm"
              />
              <button
                className="absolute right-2 top-7 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(session.username);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="relative group">
              <label className="mb-1 block text-xs text-muted-foreground">Password</label>
              <Input
                readOnly
                type="text"
                value={session.password || ""}
                placeholder="Password"
                className={cn(
                  "h-10 pr-8 font-mono text-sm",
                  !session.password && "italic text-muted-foreground"
                )}
              />
            </div>
          </div>

          <div className="pt-2">
            {isConnected ? (
              <Button
                variant="destructive"
                className="w-full border border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/15"
                onClick={handleDisconnect}
                disabled={isLoading}
              >
                Disconnect
              </Button>
            ) : (
              <div className="flex gap-2">
                 <Button
                    variant="ghost"
                    className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                        e.stopPropagation();
                        if(confirm(`Delete profile ${session.name}?`)) {
                            if (onDelete) onDelete(session);
                            else deleteSavedSession(session.id);
                        }
                    }}
                 >
                    Delete
                 </Button>
                  <Button
                    className="flex-[2]"
                    onClick={handleConnect}
                    disabled={isConnecting || !session.password}
                  >
                    Connect
                  </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
