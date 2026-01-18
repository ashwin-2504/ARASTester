import React, { useState, useEffect } from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getTestPlansFldrPath, setTestPlansFldrPath } from '@/core/ipc/appSettings'

export default function Settings({ onClose }) {
  const [folderPath, setFolderPath] = useState('')

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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <div className="hidden" id="settings-desc">Application configuration settings</div>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Storage</h3>
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <label className="text-sm font-medium">Test Plans Folder</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 p-2.5 bg-muted/50 rounded-md border border-input/50">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono truncate text-foreground/90" title={folderPath}>
                    {folderPath}
                  </span>
                </div>
                <Button variant="secondary" onClick={handlePickFolder} className="shrink-0">
                  Browse...
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Location where your test plans are stored.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
