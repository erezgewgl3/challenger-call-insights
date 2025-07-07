
import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreHorizontal, 
  Copy, 
  Mail, 
  Trash2, 
  X,
  Download,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Invite, InviteFilters } from './InviteManagement';

interface InvitesTableProps {
  invites: Invite[];
  isLoading: boolean;
  filters: InviteFilters;
  onFiltersChange: (filters: InviteFilters) => void;
}

type InviteStatus = {
  status: 'pending' | 'used' | 'expired' | 'expiring';
  label: string;
  color: string;
  icon: string;
};

const getInviteStatus = (invite: Invite): InviteStatus => {
  const now = new Date();
  const expiresAt = new Date(invite.expires_at);
  
  if (invite.used_at) {
    return { status: 'used', label: 'Used', color: 'bg-green-100 text-green-800', icon: '✓' };
  }
  
  if (now > expiresAt) {
    return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800', icon: '⏰' };
  }
  
  // Check if expiring soon (48 hours)
  const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilExpiry <= 48 && hoursUntilExpiry > 0) {
    return { status: 'expiring', label: 'Expiring Soon', color: 'bg-orange-100 text-orange-800', icon: '⚠️' };
  }
  
  return { status: 'pending', label: 'Pending', color: 'bg-blue-100 text-blue-800', icon: '📧' };
};

export function InvitesTable({ invites, isLoading, filters, onFiltersChange }: InvitesTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInvites, setSelectedInvites] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Filter invites based on current filters
  const filteredInvites = useMemo(() => {
    return invites.filter(invite => {
      const status = getInviteStatus(invite);
      const statusMatch = filters.status === 'all' || status.status === filters.status;
      const emailMatch = invite.email.toLowerCase().includes(filters.emailSearch.toLowerCase());
      
      return statusMatch && emailMatch;
    });
  }, [invites, filters]);

  // Revoke invite mutation
  const revokeInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: "Invitation Revoked",
        description: "The invitation has been successfully revoked.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to revoke invitation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Copy invite link
  const copyInviteLink = async (token: string) => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/register?token=${token}`;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Link Copied",
        description: "Invite link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  // Handle individual selection
  const handleInviteSelect = (inviteId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvites(prev => [...prev, inviteId]);
    } else {
      setSelectedInvites(prev => prev.filter(id => id !== inviteId));
      setSelectAll(false);
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvites(filteredInvites.map(invite => invite.id));
      setSelectAll(true);
    } else {
      setSelectedInvites([]);
      setSelectAll(false);
    }
  };

  // Bulk revoke
  const handleBulkRevoke = () => {
    selectedInvites.forEach(inviteId => {
      revokeInviteMutation.mutate(inviteId);
    });
    setSelectedInvites([]);
    setSelectAll(false);
  };

  // Clear filters
  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      emailSearch: ''
    });
  };

  const hasFilters = filters.status !== 'all' || filters.emailSearch;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <CardTitle>Invitations</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and track user invitations
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={filters.emailSearch}
                onChange={(e) => onFiltersChange({ ...filters, emailSearch: e.target.value })}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            
            <Select 
              value={filters.status} 
              onValueChange={(value: any) => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>
            
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
        
        {/* Show results count and bulk actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredInvites.length} {filteredInvites.length === 1 ? 'invitation' : 'invitations'} found
          </p>
          
          {selectedInvites.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedInvites.length} selected
              </span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleBulkRevoke}
                disabled={revokeInviteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Revoke Selected
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                <div className="h-4 w-4 bg-gray-200 rounded" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-20" />
                <div className="h-6 bg-gray-200 rounded w-16" />
                <div className="h-8 bg-gray-200 rounded w-8" />
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvites.map((invite) => {
                const status = getInviteStatus(invite);
                const expiresAt = new Date(invite.expires_at);
                const createdAt = new Date(invite.created_at);
                
                return (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedInvites.includes(invite.id)}
                        onCheckedChange={(checked) => handleInviteSelect(invite.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invite.email}</div>
                        {invite.created_by_user && (
                          <div className="text-sm text-muted-foreground">
                            Created by {invite.created_by_user.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.color}>
                        <span className="mr-1">{status.icon}</span>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistanceToNow(createdAt, { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {status.status === 'expired' ? (
                          <span className="text-red-600">
                            Expired {formatDistanceToNow(expiresAt, { addSuffix: true })}
                          </span>
                        ) : status.status === 'expiring' ? (
                          <span className="text-orange-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(expiresAt, { addSuffix: true })}
                          </span>
                        ) : (
                          formatDistanceToNow(expiresAt, { addSuffix: true })
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => copyInviteLink(invite.token)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Invite Link
                          </DropdownMenuItem>
                          {status.status === 'pending' && (
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => revokeInviteMutation.mutate(invite.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Revoke Invite
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
