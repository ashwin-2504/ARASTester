import React from "react";

interface SidebarPanelProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarPanel({ title, action, children }: SidebarPanelProps) {
  return (
    <div className="w-80 border-r bg-zinc-950 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-400 tracking-wider">
          {title}
        </h2>
        {action}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
    </div>
  );
}
