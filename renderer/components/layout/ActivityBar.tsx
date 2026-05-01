import { Users, FileText, Settings } from "lucide-react";

interface ActivityBarProps {
  activeView: "sessions" | "tests";
  onViewChange: (view: "sessions" | "tests") => void;
}

export function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  return (
    <div className="app-rail">
      <button
        onClick={() => onViewChange("sessions")}
        className="app-rail-button"
        data-active={activeView === "sessions"}
        title="Session Manager"
      >
        <Users />
      </button>

      <button
        onClick={() => onViewChange("tests")}
        className="app-rail-button"
        data-active={activeView === "tests"}
        title="Test Explorer"
      >
        <FileText />
      </button>

      <div className="mt-auto">
        <button
          className="app-rail-button"
          title="Settings"
        >
          <Settings />
        </button>
      </div>
    </div>
  );
}
