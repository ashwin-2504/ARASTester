import React, { useState, useEffect } from 'react'
import { FolderOpen, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTestPlansFldrPath, setTestPlansFldrPath } from '@/core/ipc/appSettings'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const [folderPath, setFolderPath] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const f = await getTestPlansFldrPath()
    setFolderPath(f || 'Not set')
  }

  const handlePickFolder = async () => {
    const res = await window.api.pickFolder()
    if (!res.canceled && res.filePaths.length > 0) {
      const path = res.filePaths[0]
      await setTestPlansFldrPath(path)
      setFolderPath(path)
    }
  }

  return (
    <div className="min-h-full bg-background">
      <div className="container mx-auto p-8 max-w-2xl animate-in fade-in duration-300">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Storage</h3>
            <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
              <div className="space-y-1">
                <label className="text-base font-medium">Test Plans Folder</label>
                <p className="text-sm text-muted-foreground">Location where your test plans are stored locally on your machine.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-input/50">
                  <FolderOpen className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-mono truncate text-foreground/90 select-all" title={folderPath}>
                    {folderPath}
                  </span>
                </div>
                <Button onClick={handlePickFolder} className="shrink-0">
                  Browse...
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
