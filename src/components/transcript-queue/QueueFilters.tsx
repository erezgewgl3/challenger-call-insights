import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface QueueFiltersProps {
  filters: {
    status: string[];
    priority: string[];
    source: string[];
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

export function QueueFilters({ filters, onFiltersChange, onClose }: QueueFiltersProps) {
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' }
  ];

  const priorityOptions = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' }
  ];

  const sourceOptions = [
    { value: 'manual', label: 'Manual Upload' },
    { value: 'zoom', label: 'Zoom' },
    { value: 'zapier', label: 'Zapier' },
    { value: 'zoho', label: 'Zoho CRM' }
  ];

  const toggleFilter = (category: keyof typeof filters, value: string) => {
    const current = filters[category];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    
    onFiltersChange({
      ...filters,
      [category]: updated
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: [],
      priority: [],
      source: []
    });
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4" />
            Queue Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <FilterGroup
          title="Status"
          options={statusOptions}
          selected={filters.status}
          onToggle={(value) => toggleFilter('status', value)}
        />
        
        <FilterGroup
          title="Priority"
          options={priorityOptions}
          selected={filters.priority}
          onToggle={(value) => toggleFilter('priority', value)}
        />
        
        <FilterGroup
          title="Source"
          options={sourceOptions}
          selected={filters.source}
          onToggle={(value) => toggleFilter('source', value)}
        />
      </CardContent>
    </Card>
  );
}

function FilterGroup({ 
  title, 
  options, 
  selected, 
  onToggle 
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Badge
            key={option.value}
            variant={selected.includes(option.value) ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/80"
            onClick={() => onToggle(option.value)}
          >
            {option.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}