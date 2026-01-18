// renderer/services/StorageService.js

export async function pickFolder() {
  return await window.api.pickFolder();
}

export async function readFile(filePath) {
  return await window.api.readFile(filePath);
}

export async function writeFile(filePath, data) {
  return await window.api.writeFile(filePath, data);
}

export async function listJsonFiles(folderPath) {
  return await window.api.listJsonFiles(folderPath);
}

export async function deleteFile(filePath) {
  return await window.api.deleteFile(filePath);
}
