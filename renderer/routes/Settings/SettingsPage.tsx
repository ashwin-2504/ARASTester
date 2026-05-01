import { useState, useEffect } from 'react'
import { FolderOpen, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTestPlansFldrPath, setTestPlansFldrPath } from '@/core/ipc/appSettings'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const [folderPath, setFolderPath] = useState('')
  const navigate = useNavigate()

  const loadSettings = async () => {
    const folder = await getTestPlansFldrPath()
    setFolderPath(folder || 'Not set')
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  const handlePickFolder = async () => {
    const res = await window.api.pickFolder()
    if (!res.canceled && res.filePaths.length > 0) {
      const selectedPath = res.filePaths[0]
      await setTestPlansFldrPath(selectedPath)
      setFolderPath(selectedPath)
    }
  }

  return (
    <div className="app-page">
      <div className="app-page-inner max-w-3xl animate-in fade-in duration-300">
        <div className="app-page-header">
          <div className="flex min-w-0 items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 space-y-1">
              <div className="app-section-label">Application</div>
              <h1 className="app-page-title">Settings</h1>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <div className="app-section-label">Storage</div>
            <div className="app-surface space-y-5 p-6">
              <div className="space-y-1">
                <label className="text-base font-medium">Test Plans Folder</label>
                <p className="app-field-hint">Location where your test plans are stored locally on your machine.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex flex-1 items-center gap-3 rounded-xl border border-input/70 bg-panelMuted p-3">
                  <FolderOpen className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-mono truncate text-foreground/90 select-all" title={folderPath}>
                    {folderPath}
                  </span>
                </div>
                <Button onClick={() => { void handlePickFolder() }} className="shrink-0">
                  Browse...
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
