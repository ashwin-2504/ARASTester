import { useState, useCallback } from "react";
import { ActionExecutor } from "@/core/services/ActionExecutor";
import { useSessionStore } from "@/stores/useSessionStore";
import type { Test, Action, TestPlan } from "@/types/plan";
import type { ApiOptions } from "@/core/api/client";

export interface ExecutionLog {
  status: string;
  timestamp: string;
  details?: unknown;
}

export function usePlanExecution(
  plan: TestPlan,
  onLogUpdate?: (logs: Record<string, ExecutionLog>) => void,
  requestPrefix?: string
) {
  const [logs, setLogs] = useState<Record<string, ExecutionLog>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [initializingTestId, setInitializingTestId] = useState<string | null>(null);

  const updateLog = useCallback((id: string, entry: ExecutionLog) => {
    setLogs(prev => {
        const next = { ...prev, [id]: entry };
        if (onLogUpdate) onLogUpdate(next);
        return next;
    });
  }, [onLogUpdate]);

  const ensureSession = useCallback(async (profileId: string): Promise<string | undefined> => {
    const profile = plan.profiles?.find((p) => p.id === profileId);
    if (!profile) return undefined;

    const store = useSessionStore.getState();
    const existing = store.activeSessions.find((s) => s.name === profile.name);
    if (existing) return existing.name;

    const apiOptions: ApiOptions | undefined = requestPrefix ? { requestPrefix } : undefined;
    try {
      const result = await store.login({
        url: profile.url,
        database: profile.database,
        username: profile.username,
        password: profile.password || "",
        sessionName: profile.name,
      }, apiOptions);
      return result.success ? (result.sessionName || profile.name) : undefined;
    } catch (err) {
      console.error("Auto-connect error:", err);
      return undefined;
    }
  }, [plan.profiles, requestPrefix]);

  const runActionInternal = useCallback(async (action: Action, sessionName?: string) => {
    updateLog(action.actionID, {
      status: "Running...",
      timestamp: new Date().toISOString(),
    });

    const result = await ActionExecutor.execute(
      action,
      sessionName,
      requestPrefix ? { requestPrefix } : undefined
    );

    updateLog(action.actionID, {
      status: result.success ? "Success" : "Failed",
      details: result,
      timestamp: new Date().toISOString(),
    });
  }, [updateLog, requestPrefix]);

  const runTestInternal = useCallback(async (test: Test) => {
    let sessionName: string | undefined = undefined;

    if (test.sessionProfileId) {
      setInitializingTestId(test.testID);
      try {
        sessionName = await ensureSession(test.sessionProfileId);
      } finally {
        setInitializingTestId(null);
      }
    }

    for (const action of test.testActions || []) {
      if (action.isEnabled !== false) await runActionInternal(action, sessionName);
    }
  }, [ensureSession, runActionInternal]);

  const runTest = useCallback(async (test: Test) => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      await runTestInternal(test);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, runTestInternal]);

  const runAll = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      for (const test of plan.testPlan || []) {
        if (test.isEnabled !== false) await runTestInternal(test);
      }
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, plan.testPlan, runTestInternal]);

  return {
    logs, isRunning, initializingTestId, runTest, runAll, runAction: runActionInternal
  };
}
