// renderer/services/StorageService.js

export default class StorageService {
  static async pickFolder() {
    return await window.api.pickFolder();
  }

  static async readFile(filePath) {
    return await window.api.readFile(filePath);
  }

  static async writeFile(filePath, data) {
    return await window.api.writeFile(filePath, data);
  }

  static async listJsonFiles(folderPath) {
    return await window.api.listJsonFiles(folderPath);
  }

  static async deleteFile(filePath) {
    return await window.api.deleteFile(filePath);
  }
}
