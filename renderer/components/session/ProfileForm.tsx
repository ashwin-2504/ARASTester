import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useSessionStore, SavedSession } from "@/stores/useSessionStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  initialData?: SavedSession;
  onCancel: () => void;
  onSave: () => void;
}

export function ProfileForm({ initialData, onCancel, onSave }: ProfileFormProps) {
  const { addSavedSession, updateSavedSession, isLoading } = useSessionStore();
  const [formData, setFormData] = useState({
    name: "",
    url: "http://localhost/InnovatorServer/Server/InnovatorServer.aspx",
    database: "InnovatorSolutions",
    username: "admin",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        url: initialData.url,
        database: initialData.database,
        username: initialData.username,
        password: initialData.password || "",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url || !formData.database || !formData.username) {
        setError("Please fill in all required fields");
        return;
    }

    try {
        if (initialData) {
            updateSavedSession(initialData.id, {
                ...formData,
                sessionName: formData.name // Keeping sessionName synced with display name for simplicty
            });
        } else {
            addSavedSession({
                ...formData,
                sessionName: formData.name
            });
        }
        onSave();
    } catch (err) {
        setError("Failed to save profile");
    }
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={onCancel} className="-ml-2 h-8 w-8 text-zinc-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold text-zinc-100">
          {initialData ? "Edit Profile" : "New Profile"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-zinc-400">Profile Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Admin_Main"
            className="bg-zinc-900/50 border-zinc-800"
            autoFocus
          />
        </div>

        <div className="space-y-2">
            <Label htmlFor="username" className="text-zinc-400">Username</Label>
            <Input
            id="username"
            value={formData.username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, username: e.target.value })}
            placeholder="admin"
            className="bg-zinc-900/50 border-zinc-800"
            />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-zinc-400">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            className="bg-zinc-900/50 border-zinc-800"
          />
        </div>

        <div className="space-y-2">
            <Label htmlFor="database" className="text-zinc-400">Database</Label>
            <Input
            id="database"
            value={formData.database}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, database: e.target.value })}
            placeholder="InnovatorSolutions"
            className="bg-zinc-900/50 border-zinc-800"
            />
        </div>

        <div className="space-y-2">
          <Label htmlFor="url" className="text-zinc-400">Server URL</Label>
          <Input
            id="url"
            value={formData.url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, url: e.target.value })}
            placeholder="http://..."
            className="bg-zinc-900/50 border-zinc-800 text-xs font-mono"
          />
        </div>

        {error && (
            <div className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 p-2 rounded">
                <AlertCircle className="h-3 w-3" />
                {error}
            </div>
        )}

        <div className="pt-4">
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile"}
            </Button>
        </div>
      </form>
    </div>
  );
}
