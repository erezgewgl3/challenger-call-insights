
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, Download, Copy, X } from 'lucide-react'

interface BulkOperationsToolbarProps {
  selectedCount: number
  onBulkDelete: () => void
  onBulkExport: () => void
  onBulkDuplicate: () => void
  onClearSelection: () => void
  isLoading?: boolean
}

export function BulkOperationsToolbar({
  selectedCount,
  onBulkDelete,
  onBulkExport,
  onBulkDuplicate,
  onClearSelection,
  isLoading = false
}: BulkOperationsToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {selectedCount} prompt{selectedCount > 1 ? 's' : ''} selected
            </Badge>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDuplicate}
                disabled={isLoading}
                className="flex items-center space-x-1"
              >
                <Copy className="h-4 w-4" />
                <span>Duplicate</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkExport}
                disabled={isLoading}
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDelete}
                disabled={isLoading}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="flex items-center space-x-1"
          >
            <X className="h-4 w-4" />
            <span>Clear Selection</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
