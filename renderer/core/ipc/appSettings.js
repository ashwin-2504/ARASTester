// renderer/appSettings.js

export async function getSettings() {
  try {
    return await window.api.settings.read();
  } catch {
    return {};
  }
}

export async function saveSettings(settings) {
  await window.api.settings.write(settings);
}

export async function getTestPlansFldrPath() {
  const s = await getSettings();
  return s.testPlanFolder || null;
}

export async function setTestPlansFldrPath(path) {
  const s = await getSettings();
  s.testPlanFolder = path;
  await saveSettings(s);
}
