import { useState } from "react";
import { Plus } from "lucide-react";
import { SavedSession, useSessionStore } from "@/stores/useSessionStore";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "./ProfileCard";
import { ProfileForm, type ProfileFormValues } from "./ProfileForm";
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

  const handleFormSubmit = (data: ProfileFormValues) => {
      const sessionValues = {
          name: data.name,
          sessionName: data.sessionName,
          url: data.url,
          database: data.database,
          username: data.username,
          password: data.password,
      };

      if (isPlanMode) {
          if (editingSession) {
              onUpdate?.(editingSession.id, sessionValues);
          } else {
              onAdd?.({ ...sessionValues, id: crypto.randomUUID() });
          }
      } else {
          if (editingSession) {
             updateSavedSession(editingSession.id, sessionValues);
          } else {
             addSavedSession(sessionValues);
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
          className="h-8 px-2 text-xs text-success hover:bg-success/10 hover:text-success"
          onClick={handleCreateNew}
        >
          <Plus className="h-3 w-3 mr-1" /> New Profile
        </Button>
      }
    >
      <div className="space-y-3">
        {displayProfiles.length === 0 ? (
            <div className="app-empty-state px-4 py-10">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-panelMuted text-muted-foreground">
                    <Plus className="h-6 w-6" />
                </div>
                <h3 className="mb-1 font-medium text-foreground">No profiles yet</h3>
                <p className="mb-4 text-xs text-muted-foreground">
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
