// renderer/services/StorageService.ts

export async function pickFolder(): Promise<string | null> {
  return await window.api.pickFolder();
}

export async function readFile(folderPath: string, relativePath: string): Promise<string> {
  return await window.api.readFile(folderPath, relativePath);
}

export async function writeFile(folderPath: string, relativePath: string, data: any): Promise<void> {
  return await window.api.writeFile(folderPath, relativePath, data);
}

export async function listJsonFiles(folderPath: string, relativePath: string = "."): Promise<string[]> {
  return await window.api.listJsonFiles(folderPath, relativePath);
}

export async function deleteFile(folderPath: string, relativePath: string): Promise<void> {
  return await window.api.deleteFile(folderPath, relativePath);
}
