import React from "react";

interface SidebarPanelProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarPanel({ title, action, children }: SidebarPanelProps) {
  return (
    <div className="app-sidebar-panel">
      <div className="app-sidebar-panel__header">
        <h2 className="app-section-label">{title}</h2>
        {action}
      </div>
      <div className="app-sidebar-panel__body">{children}</div>
    </div>
  );
}
