import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { SavedSession } from "@/stores/useSessionStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ProfileFormValues {
  id?: string;
  name: string;
  sessionName: string;
  url: string;
  database: string;
  username: string;
  password: string;
}

interface ProfileFormProps {
  initialData?: SavedSession;
  onCancel: () => void;
  onSubmit: (data: ProfileFormValues) => void | Promise<void>;
  isLoading?: boolean;
}

export function ProfileForm({ initialData, onCancel, onSubmit, isLoading = false }: ProfileFormProps) {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name || !formData.url || !formData.database || !formData.username) {
        setError("Please fill in all required fields");
        return;
    }

    setError(null);
    void Promise.resolve(onSubmit({
      ...formData,
      sessionName: formData.name,
      id: initialData?.id,
    })).catch(() => {
      setError("Failed to save profile");
    });
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onCancel} className="-ml-2 h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <div className="app-section-label">Session Profile</div>
          <h3 className="font-semibold text-foreground">{initialData ? "Edit Profile" : "New Profile"}</h3>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="app-field">
          <Label htmlFor="name" className="text-muted-foreground">Profile Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Admin_Main"
            autoFocus
          />
        </div>

        <div className="app-field">
            <Label htmlFor="username" className="text-muted-foreground">Username</Label>
            <Input
            id="username"
            value={formData.username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, username: e.target.value })}
            placeholder="admin"
            />
        </div>

        <div className="app-field">
          <Label htmlFor="password" className="text-muted-foreground">Password</Label>
          <Input
            id="password"
            type="text"
            value={formData.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Password"
          />
        </div>

        <div className="app-field">
            <Label htmlFor="database" className="text-muted-foreground">Database</Label>
            <Input
            id="database"
            value={formData.database}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, database: e.target.value })}
            placeholder="InnovatorSolutions"
            />
        </div>

        <div className="app-field">
          <Label htmlFor="url" className="text-muted-foreground">Server URL</Label>
          <Input
            id="url"
            value={formData.url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, url: e.target.value })}
            placeholder="http://..."
            className="font-mono text-xs"
          />
        </div>

        {error && (
            <div className="app-inline-status app-inline-status--error w-full justify-start rounded-xl px-3 py-2 text-xs">
                <AlertCircle className="h-3 w-3" />
                {error}
            </div>
        )}

        <div className="pt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (initialData ? "Update Profile" : "Create Profile")}
            </Button>
        </div>
      </form>
    </div>
  );
}
