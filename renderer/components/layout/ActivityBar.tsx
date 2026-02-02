import { Users, FileText, Settings } from "lucide-react";

interface ActivityBarProps {
  activeView: "sessions" | "tests";
  onViewChange: (view: "sessions" | "tests") => void;
}

export function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  return (
    <div className="w-12 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-4">
      <button
        onClick={() => onViewChange("sessions")}
        className={`p-2 rounded-lg transition-colors ${
          activeView === "sessions"
            ? "bg-emerald-500/10 text-emerald-500"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
        title="Session Manager"
      >
        <Users className="h-5 w-5" />
      </button>

      <button
        onClick={() => onViewChange("tests")}
        className={`p-2 rounded-lg transition-colors ${
          activeView === "tests"
            ? "bg-emerald-500/10 text-emerald-500"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
        title="Test Explorer"
      >
        <FileText className="h-5 w-5" />
      </button>

      <div className="mt-auto">
        <button
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
