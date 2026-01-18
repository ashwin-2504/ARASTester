import React, { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function PlanModal({ isOpen, onClose, onSave, plan = null }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const isEdit = !!plan

  useEffect(() => {
    if (plan) {
      setTitle(plan.title || '')
      setDescription(plan.description || '')
    } else {
      setTitle('')
      setDescription('')
    }
  }, [plan, isOpen])

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSave = useCallback(() => {
    if (!title.trim()) return
    onSave({ title: title.trim(), description: description.trim() })
    onClose()
  }, [title, description, onSave, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="m-auto w-full max-w-md bg-[#1e1e2e] border border-[#313244] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#313244]">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? 'Edit Test Plan' : 'Create New Test Plan'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-[#313244] transition-colors"
          >
            <X className="h-5 w-5 text-[#6c7086] hover:text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Title Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#cdd6f4]">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. End-to-End Payment Flow"
              className="bg-[#11111b] border-[#313244] text-white placeholder:text-[#6c7086] focus:border-[#89b4fa]"
              autoFocus
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#cdd6f4]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe the scope and objective of this test plan..."
              rows={4}
              className="w-full rounded-md bg-[#11111b] border border-[#313244] text-white placeholder:text-[#6c7086] focus:border-[#89b4fa] focus:outline-none focus:ring-1 focus:ring-[#89b4fa] px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#313244]">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[#cdd6f4] hover:bg-[#313244] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white disabled:opacity-50"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
