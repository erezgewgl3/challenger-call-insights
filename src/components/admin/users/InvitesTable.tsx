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
  Clock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Invite, InviteFilters } from './InviteManagement';
import { generateSecureInviteLink, logSecurityEvent } from '@/utils/domainUtils';

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
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());

  // Filter invites based on current filters
  const filteredInvites = useMemo(() => {
    return invites.filter(invite => {
      const status = getInviteStatus(invite);
      const statusMatch = filters.status === 'all' || status.status === filters.status;
      const emailMatch = invite.email.toLowerCase().includes(filters.emailSearch.toLowerCase());
      
      return statusMatch && emailMatch;
    });
  }, [invites, filters]);

  // Revoke invite mutation - uses edge function to clean up orphaned auth users
  const revokeInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { data, error } = await supabase.functions.invoke('revoke-invite-with-cleanup', {
        body: { inviteId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: "Invitation Revoked",
        description: data?.orphanedUserDeleted 
          ? "Invitation and orphaned user account have been cleaned up."
          : "The invitation has been successfully revoked.",
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

  // Resend email mutation
  const resendEmailMutation = useMutation({
    mutationFn: async (invite: Invite) => {
      // Use secure domain utility instead of hardcoded baseUrl
      const inviteLink = generateSecureInviteLink(invite.token);
      
      // Log security event
      logSecurityEvent('invite_email_resent', {
        email: invite.email,
        domain: inviteLink.split('/register')[0],
        inviteId: invite.id
      });
      
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'invite',
          to: invite.email,
          data: {
            email: invite.email,
            inviteLink,
            expiresAt: invite.expires_at,
            invitedBy: invite.created_by_user?.email || 'Sales Whisperer Team'
          }
        }
      });

      if (error) throw error;

      // Update invite status
      const { error: updateError } = await supabase
        .from('invites')
        .update({ 
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          email_error: null
        })
        .eq('id', invite.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] });
      toast({
        title: "Email Resent",
        description: "Invitation email has been resent successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Resend",
        description: "Failed to resend invitation email. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Copy invite link with secure domain
  const copyInviteLink = async (token: string) => {
    // Use secure domain utility instead of window.location.origin
    const inviteLink = generateSecureInviteLink(token);
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      
      logSecurityEvent('invite_link_copied_table', {
        domain: inviteLink.split('/register')[0],
        token: token.substring(0, 8) + '...' // Log partial token for security
      });
      
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

  // Toggle token visibility
  const toggleTokenVisibility = (inviteId: string) => {
    setVisibleTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(inviteId)) {
        newSet.delete(inviteId);
      } else {
        newSet.add(inviteId);
      }
      return newSet;
    });
  };

  // Copy token directly
  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast({
        title: "Token Copied",
        description: "Token copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the token manually",
        variant: "destructive",
      });
    }
  };

  // Format token for display
  const formatToken = (token: string, isVisible: boolean) => {
    if (!isVisible) {
      return '•'.repeat(8) + token.slice(-4);
    }
    return token;
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
          <div className="overflow-x-auto">
            <Table className="min-w-[650px] w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 py-5">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[180px] py-5 px-4">Email</TableHead>
                  <TableHead className="min-w-[200px] py-5 px-4">Token</TableHead>
                  <TableHead className="w-[100px] py-5 px-4">Status</TableHead>
                  <TableHead className="w-[100px] py-5 px-4">Email Status</TableHead>
                  <TableHead className="w-[120px] py-5 px-4">Created</TableHead>
                  <TableHead className="w-[120px] py-5 px-4">Expires</TableHead>
                  <TableHead className="w-12 py-5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvites.map((invite) => {
                  const status = getInviteStatus(invite);
                  const expiresAt = new Date(invite.expires_at);
                  const createdAt = new Date(invite.created_at);
                  
                  return (
                    <TableRow key={invite.id} className="hover:bg-muted/30">
                      <TableCell className="py-5 px-4">
                        <Checkbox
                          checked={selectedInvites.includes(invite.id)}
                          onCheckedChange={(checked) => handleInviteSelect(invite.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="py-5 px-4">
                        <div>
                          <div className="font-medium text-foreground truncate">{invite.email}</div>
                          {invite.created_by_user && (
                            <div className="text-sm text-muted-foreground mt-1 truncate">
                              Created by {invite.created_by_user.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-4">
                        <div className="flex items-center gap-3 min-w-0 max-w-full">
                          <code className="bg-muted/60 px-3 py-2 rounded-md text-sm font-mono tracking-wider text-foreground flex-1 min-w-0 border border-border/50 overflow-hidden text-ellipsis whitespace-nowrap">
                            {formatToken(invite.token, visibleTokens.has(invite.id))}
                          </code>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTokenVisibility(invite.id)}
                              className="h-8 w-8 p-0 hover:bg-muted/80"
                              title={visibleTokens.has(invite.id) ? "Hide token" : "Show token"}
                            >
                              {visibleTokens.has(invite.id) ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToken(invite.token)}
                              className="h-8 w-8 p-0 hover:bg-muted/80"
                              title="Copy token"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-4">
                        <Badge variant="outline" className={`${status.color} px-3 py-1.5 font-medium`}>
                          <span className="mr-2">{status.icon}</span>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 px-4">
                        {invite.email_error ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800 px-2 py-1">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        ) : invite.email_sent ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 px-2 py-1">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sent
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 px-2 py-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-5 px-4">
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(createdAt, { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-4">
                        <div className="text-sm">
                          {status.status === 'expired' ? (
                            <span className="text-destructive font-medium">
                              Expired {formatDistanceToNow(expiresAt, { addSuffix: true })}
                            </span>
                          ) : status.status === 'expiring' ? (
                            <span className="text-orange-600 flex items-center gap-1 font-medium">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(expiresAt, { addSuffix: true })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {formatDistanceToNow(expiresAt, { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted/80">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-card border shadow-md z-50">
                            <DropdownMenuItem onClick={() => copyInviteLink(invite.token)} className="cursor-pointer">
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Invite Link
                            </DropdownMenuItem>
                            {status.status === 'pending' && (
                              <DropdownMenuItem 
                                onClick={() => resendEmailMutation.mutate(invite)}
                                disabled={resendEmailMutation.isPending}
                                className="cursor-pointer"
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Resend Email
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => revokeInviteMutation.mutate(invite.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
