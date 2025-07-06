
import React, { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TranscriptNameDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string) => void
  file: File | null
  defaultName: string
}

export function TranscriptNameDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  file, 
  defaultName 
}: TranscriptNameDialogProps) {
  const [name, setName] = useState('')

  // Update name when defaultName changes
  useEffect(() => {
    setName(defaultName)
  }, [defaultName])

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim())
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Name Your Transcript</DialogTitle>
          <DialogDescription>
            Give your transcript a meaningful name before analysis begins.
          </DialogDescription>
        </DialogHeader>
        
        {file && (
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-full">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="transcript-name">Transcript Name</Label>
          <Input
            id="transcript-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
            autoFocus
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!name.trim()}
          >
            Continue Analysis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
