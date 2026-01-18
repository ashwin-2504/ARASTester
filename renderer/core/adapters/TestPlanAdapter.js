// renderer/core/adapters/TestPlanAdapter.js
import StorageService from "./StorageService.js"
import { getTestPlansFldrPath } from "../ipc/appSettings.js"

export default class TestPlanAdapter {
  static async getFolderPath() {
    return await getTestPlansFldrPath()
  }

  static async getPlans() {
    const folder = await this.getFolderPath()
    if (!folder) return []

    try {
      const files = await StorageService.listJsonFiles(folder)
      const plans = []
      for (const f of files) {
        try {
          const raw = await StorageService.readFile(f)
          const json = JSON.parse(raw)
          const filename = f.replace(/\\/g, "/").split("/").pop()
          plans.push({ ...json, __id: f, __filename: filename })
        } catch (err) {
          console.error("Failed reading plan", f, err)
        }
      }
      plans.sort((a, b) =>
        (b.updated || b.created || "").localeCompare(a.updated || a.created || "")
      )
      return plans
    } catch (error) {
      console.error("Error listing plans:", error)
      return []
    }
  }

  static async createPlan(title, description) {
    const folder = await this.getFolderPath()
    if (!folder) throw new Error("No test plan folder set.")

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let randomStr = ""
    for (let i = 0; i < 12; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const fileName = `${randomStr}.json`
    const filePath = `${folder}/${fileName}`

    const payload = {
      title: title || "New Test Plan",
      description: description || "",
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      testPlan: [
        {
          testID: `T${Date.now()}`,
          testTitle: "Setup",
          isEnabled: true,
          testActions: [
            {
              actionID: `A${Date.now()}`,
              actionTitle: "Connect to ARAS",
              actionType: "ArasConnect",
              isEnabled: true,
              params: {
                url: "http://localhost/InnovatorServer/Server/InnovatorServer.aspx",
                database: "InnovatorSolutions",
                username: "admin",
                password: "innovator"
              }
            }
          ]
        }
      ]
    }

    await StorageService.writeFile(filePath, payload)
    return { ...payload, __id: filePath, __filename: fileName }
  }

  static async getPlan(filename) {
    const folder = await this.getFolderPath()
    if (!folder) throw new Error("No folder set")

    const filePath = `${folder}/${filename}`
    const raw = await StorageService.readFile(filePath)
    const data = JSON.parse(raw)
    return { ...data, __id: filePath, __filename: filename }
  }

  static async updatePlan(filename, data) {
    const folder = await this.getFolderPath()
    const filePath = `${folder}/${filename}`

    const current = await this.getPlan(filename)

    const merged = {
      ...current,
      ...data,
      updated: new Date().toISOString()
    }

    delete merged.__id
    delete merged.__filename

    await StorageService.writeFile(filePath, merged)
    return { ...merged, __id: filePath, __filename: filename }
  }

  static async deletePlan(filename) {
    const folder = await this.getFolderPath()
    const filePath = `${folder}/${filename}`
    await StorageService.deleteFile(filePath)
  }
}
