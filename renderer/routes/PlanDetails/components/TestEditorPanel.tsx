import React from 'react'
import { Check, ChevronDown, Database } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { BufferedInput } from './BufferedInput'
import type { Test, TestPlan } from '@/types/plan'

interface TestEditorPanelProps {
  test: Test;
  plan: TestPlan;
  onUpdate: (updates: Partial<Test>) => void;
  onManageProfiles: () => void;
}

export const TestEditorPanel = ({
  test,
  plan,
  onUpdate,
  onManageProfiles
}: TestEditorPanelProps) => {
  return (
    <>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Test Title</label>
        <BufferedInput
          value={test.testTitle}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ testTitle: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Session Profile</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <span className="truncate">
                    {(() => {
                      const pid = test.sessionProfileId;
                      if (!pid) return "Default (Active Session)";
                      const p = plan.profiles?.find(p => p.id === pid);
                      return p ? p.name : "Unknown Profile";
                    })()}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[200px] w-[var(--radix-dropdown-menu-trigger-width)]" align="start">
                <DropdownMenuItem
                  onSelect={() => onUpdate({ sessionProfileId: undefined })}
                  className="cursor-pointer"
                >
                  Default (Active Session)
                  {!test.sessionProfileId && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                {plan.profiles?.map(p => (
                  <DropdownMenuItem
                    key={p.id}
                    onSelect={() => onUpdate({ sessionProfileId: p.id })}
                    className="cursor-pointer"
                  >
                    {p.name}
                    {test.sessionProfileId === p.id && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            variant="outline"
            size="icon"
            title="Manage Profiles"
            onClick={onManageProfiles}
          >
            <Database className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="testEnabled"
          checked={test.isEnabled !== false}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ isEnabled: e.target.checked })}
          className="rounded border-border text-primary focus:ring-primary h-4 w-4"
        />
        <label htmlFor="testEnabled" className="text-sm font-medium">Enabled</label>
      </div>
    </>
  )
}
