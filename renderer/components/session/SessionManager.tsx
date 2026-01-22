import { useState } from "react";
import { Plus } from "lucide-react";
import { SavedSession, useSessionStore } from "@/stores/useSessionStore";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "./ProfileCard";
import { ProfileForm } from "./ProfileForm";
import { SidebarPanel } from "@/components/layout/SidebarPanel";

export function SessionManager() {
  const { savedSessions } = useSessionStore();
  const [view, setView] = useState<"list" | "form">("list");
  const [editingSession, setEditingSession] = useState<SavedSession | undefined>(undefined);

  const handleCreateNew = () => {
    setEditingSession(undefined);
    setView("form");
  };

  const handleEdit = (session: SavedSession) => {
      setEditingSession(session);
      setView("form");
  };

  const handleBackToList = () => {
      setView("list");
      setEditingSession(undefined);
  }

  // Render Form View
  if (view === "form") {
      return (
          <SidebarPanel title="SESSION MANAGER">
              <ProfileForm 
                initialData={editingSession}
                onCancel={handleBackToList}
                onSave={handleBackToList}
              />
          </SidebarPanel>
      )
  }

  // Render List View
  return (
    <SidebarPanel
      title="PROFILES"
      action={
        <Button
          variant="ghost"
          size="sm"
          className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 text-xs px-2 h-7"
          onClick={handleCreateNew}
        >
          <Plus className="h-3 w-3 mr-1" /> New Profile
        </Button>
      }
    >
      <div className="space-y-3">
        {savedSessions.length === 0 ? (
            <div className="text-center py-10 px-4">
                <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
                    <Plus className="h-6 w-6" />
                </div>
                <h3 className="text-zinc-300 font-medium mb-1">No profiles yet</h3>
                <p className="text-zinc-500 text-xs mb-4">Create a connection profile to get started.</p>
                <Button variant="outline" size="sm" onClick={handleCreateNew}>Create Profile</Button>
            </div>
        ) : (
            savedSessions.map((session) => (
            <ProfileCard
                key={session.id}
                session={session}
                onEdit={handleEdit}
            />
            ))
        )}
      </div>
    </SidebarPanel>
  );
}
