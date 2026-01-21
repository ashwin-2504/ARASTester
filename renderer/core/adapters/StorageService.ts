// renderer/services/StorageService.ts

export async function pickFolder(): Promise<string | null> {
  return await window.api.pickFolder();
}

export async function readFile(filePath: string): Promise<string> {
  return await window.api.readFile(filePath);
}

export async function writeFile(filePath: string, data: any): Promise<void> {
  return await window.api.writeFile(filePath, data);
}

export async function listJsonFiles(folderPath: string): Promise<string[]> {
  return await window.api.listJsonFiles(folderPath);
}

export async function deleteFile(filePath: string): Promise<void> {
  return await window.api.deleteFile(filePath);
}
