
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, RefreshCcw } from 'lucide-react'

interface EmptySearchStateProps {
  searchTerm: string
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function EmptySearchState({ searchTerm, onClearFilters, hasActiveFilters }: EmptySearchStateProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
      <CardContent className="p-12 text-center">
        <div className="p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <Search className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-3">
          {searchTerm ? 'No prompts found' : 'No prompts match your filters'}
        </h3>
        <p className="text-slate-600 mb-6 leading-relaxed">
          {searchTerm 
            ? `No prompts found matching "${searchTerm}". Try adjusting your search terms or filters.`
            : 'No prompts match your current filter settings. Try adjusting your filters or search criteria.'
          }
        </p>
        {hasActiveFilters && (
          <Button 
            onClick={onClearFilters} 
            className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
