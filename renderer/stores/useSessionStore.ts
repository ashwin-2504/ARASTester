import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/core/api/client";

export interface ServerInfo {
  database: string;
  userId: string;
  userName: string;
  url: string;
}

export interface SessionInfo {
  name: string;
  serverInfo: ServerInfo;
  isCurrent: boolean;
}

export interface AllSessionsResponse {
  sessions: SessionInfo[];
  currentSession: string;
}

export interface ConnectionRequest {
  url: string;
  database: string;
  username: string;
  password: string;
  sessionName?: string;
}

export interface ConnectionResponse {
  success: boolean;
  message?: string;
  serverInfo?: ServerInfo;
  sessionName?: string;
}

export interface SavedSession {
  id: string;
  name: string; // Display name e.g. "Admin_Main"
  sessionName: string; // The session ID used for backend
  url: string;
  database: string;
  username: string;
  password?: string;
}

interface SessionState {
  // State
  activeSessions: SessionInfo[];
  savedSessions: SavedSession[];
  currentSessionName: string;
  isLoading: boolean;
  error: string | null;

  // Computed
  isConnected: boolean;
  currentSession: SessionInfo | null;

  // Actions
  fetchSessions: () => Promise<void>;
  login: (credentials: ConnectionRequest) => Promise<ConnectionResponse>;
  logout: (sessionName?: string) => Promise<void>;
  setCurrentSession: (name: string) => void;
  
  // Saved Session Management
  addSavedSession: (session: Omit<SavedSession, "id">) => void;
  updateSavedSession: (id: string, updates: Partial<SavedSession>) => void;
  deleteSavedSession: (id: string) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeSessions: [],
      savedSessions: [],
      currentSessionName: "default",
      isLoading: false,
      error: null,

      // Computed properties as getters
      get isConnected() {
        const { activeSessions, currentSessionName } = get();
        return activeSessions.some((s) => s.name === currentSessionName);
      },

      get currentSession() {
        const { activeSessions, currentSessionName } = get();
        return activeSessions.find((s) => s.name === currentSessionName) || null;
      },

      // Actions
      fetchSessions: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get<AllSessionsResponse>(
            "/api/aras/sessions",
          );
          set({
            activeSessions: response.sessions || [],
            currentSessionName: response.currentSession || "default",
            isLoading: false,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to fetch sessions";
          console.error(message);
          set({ isLoading: false });
        }
      },

      login: async (credentials: ConnectionRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post<ConnectionResponse>(
            "/api/aras/connect",
            credentials,
          );

          if (response.success) {
            await get().fetchSessions();
          }

          set({ isLoading: false });
          return response;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Login failed";
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },

      logout: async (sessionName?: string) => {
        set({ isLoading: true, error: null });
        try {
          const name = sessionName || get().currentSessionName;
          const endpoint = sessionName
            ? `/api/aras/disconnect/${encodeURIComponent(name)}`
            : "/api/aras/disconnect";

          await apiClient.post(endpoint, {});
          await get().fetchSessions();
          set({ isLoading: false });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Logout failed";
          set({ error: message, isLoading: false });
        }
      },

      setCurrentSession: (name: string) => {
        set({ currentSessionName: name });
      },

      // Saved Session Actions
      addSavedSession: (session) => {
        set((state) => ({
          savedSessions: [
            ...state.savedSessions,
            { ...session, id: crypto.randomUUID() },
          ],
        }));
      },

      updateSavedSession: (id, updates) => {
        set((state) => ({
          savedSessions: state.savedSessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteSavedSession: (id) => {
        set((state) => ({
          savedSessions: state.savedSessions.filter((s) => s.id !== id),
        }));
      },
    }),
    {
      name: "aras-session-store", // unique name
      partialize: (state) => ({ savedSessions: state.savedSessions }), // only persist savedSessions
    }
  )
);
