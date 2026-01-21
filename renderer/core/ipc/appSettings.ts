// renderer/appSettings.ts

export interface Settings {
  testPlanFolder?: string;
  [key: string]: any;
}

export async function getSettings(): Promise<Settings> {
  try {
    return await window.api.settings.read();
  } catch {
    return {};
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await window.api.settings.write(settings);
}

export async function getTestPlansFldrPath(): Promise<string | null> {
  const s = await getSettings();
  return s.testPlanFolder || null;
}

export async function setTestPlansFldrPath(path: string): Promise<void> {
  const s = await getSettings();
  s.testPlanFolder = path;
  await saveSettings(s);
}
