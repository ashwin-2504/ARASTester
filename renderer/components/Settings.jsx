import React, { useState, useEffect, useCallback } from 'react'
import { X, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTestPlansFldrPath, setTestPlansFldrPath } from '../appSettings'

export default function Settings({ onClose }) {
  const [activeTab, setActiveTab] = useState('general')
  const [folderPath, setFolderPath] = useState('')

  // Handle ESC key to close
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose?.()
    }
  }, [onClose])

  useEffect(() => {
    loadSettings()
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

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
    <div className="fixed inset-0 z-50 flex bg-background/80 backdrop-blur-sm text-foreground animate-in fade-in duration-200">
      <div className="m-auto w-full max-w-2xl bg-background border rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={onClose}
          >
            <span className="text-xs text-muted-foreground group-hover:text-foreground">ESC</span>
            <div className="rounded-full p-1 hover:bg-muted transition-colors">
              <X className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Test Plans Folder</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 p-3 bg-secondary rounded-md">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-mono truncate text-foreground/90" title={folderPath}>
                      {folderPath}
                    </span>
                  </div>
                  <Button variant="secondary" onClick={handlePickFolder} className="shrink-0">
                    Change Folder
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This folder will be used to store all your test plans.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
