import React, { useState, useEffect } from 'react'
import { X, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTestPlansFldrPath, setTestPlansFldrPath } from '../appSettings'

export default function Settings({ onNavigate, onBack }) {
  const [activeTab, setActiveTab] = useState('general')
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
    <div className="fixed inset-0 z-50 flex bg-background text-foreground animate-in fade-in duration-200">
      {/* Sidebar */}
      <div className="w-[280px] bg-secondary flex flex-col gap-2 pt-10 px-3 border-r border-border/50">
        <div className="px-2 mb-4">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Settings</h2>
        </div>

        <div className="space-y-1">
          <div className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider mt-2">
            App Settings
          </div>
          <Button 
            variant="ghost" 
            className={`w-full justify-start px-2 h-8 text-sm font-medium ${activeTab === 'general' ? 'bg-primary/20 text-foreground' : 'text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground'}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        {/* Close Button Column */}
        <div className="absolute right-0 top-0 h-full w-[60px] pt-10 pr-4 flex flex-col items-center">
          <div className="flex flex-col items-center cursor-pointer group" onClick={onBack}>
            <div className="rounded-full border-2 border-muted-foreground p-1 group-hover:border-foreground transition-colors opacity-70 group-hover:opacity-100">
              <X className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground font-bold mt-1 group-hover:text-foreground opacity-70 group-hover:opacity-100">ESC</span>
          </div>
        </div>

        {/* Main Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl px-10 py-14">
            {activeTab === 'general' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-xl font-semibold mb-6">General Settings</h2>
                  
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
