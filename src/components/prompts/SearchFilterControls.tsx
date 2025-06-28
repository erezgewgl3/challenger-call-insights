
import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, ArrowUpDown, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SearchFilterControlsProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onFilterStatusChange: (value: string) => void
  sortBy: string
  onSortByChange: (value: string) => void
  sortOrder: string
  onSortOrderChange: (value: string) => void
  totalResults: number
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function SearchFilterControls({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  totalResults,
  onClearFilters,
  hasActiveFilters
}: SearchFilterControlsProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search prompts by name or content..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4 py-2 w-full"
        />
      </div>

      {/* Filters and Sort Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>

        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <ArrowUpDown className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Sort:</span>
        </div>

        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date Created</SelectItem>
            <SelectItem value="version_number">Version</SelectItem>
            <SelectItem value="prompt_name">Name</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={onSortOrderChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500">Quick filters:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFilterStatusChange('active')}
          className={`text-xs ${filterStatus === 'active' ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
        >
          Active Prompts
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFilterStatusChange('inactive')}
          className={`text-xs ${filterStatus === 'inactive' ? 'bg-gray-50 border-gray-200 text-gray-700' : ''}`}
        >
          Inactive Versions
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onSortByChange('created_at')
            onSortOrderChange('desc')
          }}
          className="text-xs"
        >
          Recently Created
        </Button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {totalResults} prompt{totalResults !== 1 ? 's' : ''} found
        </Badge>
      </div>
    </div>
  )
}
