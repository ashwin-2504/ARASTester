import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Copy, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSessionStore } from '@/stores/useSessionStore';
import type { PlanProfile } from '@/types/plan';

interface PlanProfilesDialogProps {
  profiles: PlanProfile[];
  onAdd: (profile: PlanProfile) => void;
  onUpdate: (id: string, updates: Partial<PlanProfile>) => void;
  onDelete: (id: string) => void;
  trigger?: React.ReactNode;
}

export function PlanProfilesDialog({
  profiles,
  onAdd,
  onUpdate,
  onDelete,
  trigger
}: PlanProfilesDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PlanProfile>>({});
  
  const savedSessions = useSessionStore((state) => state.savedSessions);

  const handleStartEdit = (profile: PlanProfile) => {
    setEditingId(profile.id);
    setEditForm(profile);
  };

  const handleStopEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (editingId && editForm.name) {
      onUpdate(editingId, editForm);
      handleStopEdit();
    }
  };

  const handleAddWrapper = () => {
    const newProfile: PlanProfile = {
      id: crypto.randomUUID(),
      name: "New Profile",
      url: "http://localhost/InnovatorServer",
      database: "InnovatorSolutions",
      username: "admin",
      password: "password",
    };
    onAdd(newProfile);
    handleStartEdit(newProfile);
  };

  const handleImport = (saved: any) => {
    const newProfile: PlanProfile = {
      id: crypto.randomUUID(),
      name: saved.name,
      url: saved.url,
      database: saved.database,
      username: saved.username,
      password: saved.password || "",
    };
    onAdd(newProfile);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Manage Profiles</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Test Plan Profiles</DialogTitle>
          <DialogDescription>
            Manage embedded connection profiles for this test plan. These travel with the plan file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* List of Profiles */}
          <div className="space-y-2">
             {profiles.map(profile => (
                <div key={profile.id} className="border rounded-md p-3 flex flex-col gap-2">
                   {editingId === profile.id ? (
                       <div className="grid gap-2">
                           <Input 
                             placeholder="Profile Name" 
                             value={editForm.name} 
                             onChange={e => setEditForm({...editForm, name: e.target.value})} 
                           />
                           <div className="grid grid-cols-2 gap-2">
                               <Input placeholder="URL" value={editForm.url} onChange={e => setEditForm({...editForm, url: e.target.value})} />
                               <Input placeholder="Database" value={editForm.database} onChange={e => setEditForm({...editForm, database: e.target.value})} />
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                               <Input placeholder="Username" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} />
                               <Input type="text" placeholder="Password" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} />
                           </div>
                           <div className="flex justify-end gap-2 mt-2">
                               <Button size="sm" variant="ghost" onClick={handleStopEdit}><X className="h-4 w-4 mr-1"/> Cancel</Button>
                               <Button size="sm" onClick={handleSaveEdit}><Save className="h-4 w-4 mr-1"/> Save</Button>
                           </div>
                       </div>
                   ) : (
                       <div className="flex items-center justify-between">
                           <div>
                               <div className="font-medium">{profile.name}</div>
                               <div className="text-xs text-muted-foreground">{profile.url} / {profile.database} / {profile.username}</div>
                           </div>
                           <div className="flex gap-1">
                               <Button size="icon" variant="ghost" onClick={() => handleStartEdit(profile)}>
                                   <Edit2 className="h-4 w-4" />
                               </Button>
                               <Button size="icon" variant="ghost" onClick={() => onDelete(profile.id)}>
                                   <Trash2 className="h-4 w-4 text-destructive" />
                               </Button>
                           </div>
                       </div>
                   )}
                </div>
             ))}
             {profiles.length === 0 && <div className="text-center text-muted-foreground py-4">No embedded profiles yet.</div>}
          </div>
          
          <Button onClick={handleAddWrapper} className="w-full" variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Create New Profile
          </Button>

          {/* Import Section */}
          {savedSessions.length > 0 && (
              <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3">Import from Global Saved Sessions</h4>
                  <div className="grid grid-cols-2 gap-2">
                      {savedSessions.map(s => (
                          <Button key={s.id} variant="secondary" size="sm" className="justify-start" onClick={() => handleImport(s)}>
                              <Copy className="mr-2 h-3 w-3" /> {s.name}
                          </Button>
                      ))}
                  </div>
              </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
