import { useState } from "react";
import { Plus } from "lucide-react";
import { SavedSession, useSessionStore } from "@/stores/useSessionStore";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "./ProfileCard";
import { ProfileForm } from "./ProfileForm";
import { SidebarPanel } from "@/components/layout/SidebarPanel";
import { PlanProfile } from "@/types/plan";

interface SessionManagerProps {
  profiles?: PlanProfile[];
  onAdd?: (profile: PlanProfile) => void;
  onUpdate?: (id: string, updates: Partial<PlanProfile>) => void;
  onDelete?: (id: string) => void;
}

export function SessionManager({ profiles: injectedProfiles, onAdd, onUpdate, onDelete }: SessionManagerProps) {
  const { savedSessions, addSavedSession, updateSavedSession, deleteSavedSession } = useSessionStore();
  const [view, setView] = useState<"list" | "form">("list");
  const [editingSession, setEditingSession] = useState<SavedSession | undefined>(undefined);

  // Determine if we are in "Plan Mode" (injected profiles) or "Global Mode"
  const isPlanMode = !!injectedProfiles;
  const displayProfiles = injectedProfiles || savedSessions;

  const handleCreateNew = () => {
    setEditingSession(undefined);
    setView("form");
  };

  const handleEdit = (session: SavedSession) => {
      setEditingSession(session);
      setView("form");
  };

  const handleDelete = (session: SavedSession) => {
      if (isPlanMode && onDelete) {
          onDelete(session.id);
      } else {
          deleteSavedSession(session.id);
      }
  };

  const handleBackToList = () => {
      setView("list");
      setEditingSession(undefined);
  }

  const handleFormSubmit = (data: any) => {
      if (isPlanMode) {
          if (editingSession) {
              // Update
              onUpdate?.(editingSession.id, data);
          } else {
              // Create
              onAdd?.({ ...data, id: crypto.randomUUID() });
          }
      } else {
          // Global Store
          if (editingSession) {
             updateSavedSession(editingSession.id, data);
          } else {
             addSavedSession(data);
          }
      }
      handleBackToList();
  };

  // Render Form View
  if (view === "form") {
      return (
          <SidebarPanel title="SESSION MANAGER">
              <ProfileForm 
                initialData={editingSession}
                onCancel={handleBackToList}
                onSubmit={handleFormSubmit}
              />
          </SidebarPanel>
      )
  }

  // Render List View
  return (
    <SidebarPanel
      title={isPlanMode ? "PLAN PROFILES" : "GLOBAL SESSIONS"}
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
        {displayProfiles.length === 0 ? (
            <div className="text-center py-10 px-4">
                <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
                    <Plus className="h-6 w-6" />
                </div>
                <h3 className="text-zinc-300 font-medium mb-1">No profiles yet</h3>
                <p className="text-zinc-500 text-xs mb-4">
                    {isPlanMode ? "Add a profile to this test plan." : "Create a global connection profile."}
                </p>
                <Button variant="outline" size="sm" onClick={handleCreateNew}>Create Profile</Button>
            </div>
        ) : (
            displayProfiles.map((session) => (
            <ProfileCard
                key={session.id}
                session={session as SavedSession} // Type assertion as they are compatible
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
            ))
        )}
      </div>
    </SidebarPanel>
  );
}
