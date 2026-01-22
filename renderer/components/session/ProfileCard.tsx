import React, { useState } from "react";
import {
  MoreVertical,
  Copy,
  Eye,
  EyeOff,
  Wifi,
} from "lucide-react";
import { SavedSession, useSessionStore } from "@/stores/useSessionStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  session: SavedSession;
  onEdit: (session: SavedSession) => void;
}

export function ProfileCard({ session, onEdit }: ProfileCardProps) {
  const {
    activeSessions,
    login,
    logout,
    isLoading,
    deleteSavedSession,
  } = useSessionStore();
  
  const [expanded, setExpanded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Determine status
  const activeSession = activeSessions.find(
    (s) => s.name === session.sessionName
  );
  const isConnected = !!activeSession;
  const isExpired = false; // TODO: Implement expiry check based on LastAccessedAt
  
  // Status config
  const statusConfig = isConnected
    ? { label: "Connected", color: "text-emerald-500", dot: "bg-emerald-500" }
    : isExpired
    ? { label: "Expired", color: "text-red-500", dot: "bg-red-500" }
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
        "rounded-xl border transition-all duration-200 overflow-hidden",
        expanded ? "bg-zinc-900 border-zinc-700" : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700",
        isConnected && !expanded && "border-l-4 border-l-emerald-500"
      )}
    >
      {/* Header / Collapsed View */}
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="h-10 w-10 full rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
            {getInitials(session.name)}
          </div>

          <div>
            <h3 className="font-semibold text-sm text-zinc-100">
              {session.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dot)}
              />
              <span className={cn("text-xs font-medium", statusConfig.color)}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button (Icon only when collapsed) */}
        {!expanded && (
          <div className="flex items-center gap-2">
            {!isConnected ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white"
                onClick={handleConnect}
                disabled={isLoading}
              >
                Connect
              </Button>
            ) : (
             <div className="p-2"> <Wifi className="h-4 w-4 text-emerald-500" /></div>
            )}
            <div onClick={(e) => { e.stopPropagation(); setExpanded(true); }}>
              <MoreVertical className="h-4 w-4 text-zinc-500 hover:text-zinc-300" />
            </div>
          </div>
        )}
        
        {expanded && (
             <div className="p-2"> <MoreVertical className="h-4 w-4 text-zinc-500 rotate-90" /></div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-1">
          {/* Credentials Section */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 tracking-wider">CREDENTIALS</span>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs text-zinc-500 hover:text-zinc-300"
                    onClick={(e) => { e.stopPropagation(); onEdit(session); }}
                >
                    Edit
                </Button>
            </div>
            
            <div className="relative group">
              <label className="text-xs text-zinc-500 mb-1 block">Username</label>
              <Input
                readOnly
                value={session.username}
                className="bg-zinc-950 border-zinc-800 text-zinc-300 pr-8 h-9 text-sm font-mono"
              />
              <button
                className="absolute right-2 top-7 text-zinc-500 hover:text-zinc-300"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(session.username);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="relative group">
              <label className="text-xs text-zinc-500 mb-1 block">Password</label>
              <Input
                readOnly
                type={showPassword ? "text" : "password"}
                value={session.password || "••••••••"}
                className="bg-zinc-950 border-zinc-800 text-zinc-300 pr-8 h-9 text-sm font-mono"
              />
              <button
                className="absolute right-2 top-7 text-zinc-500 hover:text-zinc-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPassword(!showPassword);
                }}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2">
            {isConnected ? (
              <Button
                variant="destructive"
                className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 border"
                onClick={handleDisconnect}
                disabled={isLoading}
              >
                Disconnect
              </Button>
            ) : (
              <div className="flex gap-2">
                 <Button
                    variant="ghost"
                    className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={(e) => {
                        e.stopPropagation();
                        if(confirm(`Delete profile ${session.name}?`)) deleteSavedSession(session.id);
                    }}
                 >
                    Delete
                 </Button>
                  <Button
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleConnect}
                    disabled={isLoading}
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
