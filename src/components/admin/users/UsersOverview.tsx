import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Users, Shield, Clock, UserPlus, Search, MoreHorizontal, Eye, UserCog, Download, X, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { RoleBadge } from './RoleBadge';
import { ChangeRoleDialog } from './ChangeRoleDialog';
import { UserActivityModal } from './UserActivityModal';
import { UserDeletionDialog } from '../gdpr/UserDeletionDialog';
import { BulkUserDeletionDialog } from '../gdpr/BulkUserDeletionDialog';

interface UserWithCounts {
  id: string;
  email: string;
  role: 'sales_user' | 'admin';
  created_at: string;
  last_login?: string;
  transcript_count: number;
  account_count: number;
}

type UserStatus = 'active' | 'inactive' | 'dormant' | 'never';

const getUserStatus = (lastLogin?: string): { status: UserStatus; label: string; color: string; icon: string } => {
  if (!lastLogin) return { status: 'never', label: 'Never logged in', color: 'bg-gray-100 text-gray-800', icon: '⚪' };
  
  const lastLoginDate = new Date(lastLogin);
  const daysSinceLogin = (Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceLogin <= 7) return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-800', icon: '🟢' };
  if (daysSinceLogin <= 30) return { status: 'inactive', label: 'Inactive', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' };
  return { status: 'dormant', label: 'Dormant', color: 'bg-red-100 text-red-800', icon: '🔴' };
};

export function UsersOverview() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchEmail, setSearchEmail] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Role change dialog state
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    isOpen: boolean;
    user?: UserWithCounts;
    newRole?: 'admin' | 'sales_user';
  }>({ isOpen: false });

  // Activity modal state
  const [activityModal, setActivityModal] = useState<{
    isOpen: boolean;
    userId?: string;
    userName?: string;
    userRole?: 'admin' | 'sales_user';
  }>({ isOpen: false });

  // Deletion dialog state
  const [deletionDialog, setDeletionDialog] = useState<{
    isOpen: boolean;
    user?: UserWithCounts;
  }>({ isOpen: false });

  // Bulk deletion dialog state
  const [bulkDeletionDialog, setBulkDeletionDialog] = useState<{
    isOpen: boolean;
    users: UserWithCounts[];
  }>({ isOpen: false, users: [] });

  const usersPerPage = 20;

  // Fetch users data
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          transcript_count:transcripts(count),
          account_count:accounts(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(user => ({
        ...user,
        transcript_count: user.transcript_count?.[0]?.count || 0,
        account_count: user.account_count?.[0]?.count || 0
      })) as UserWithCounts[];
    }
  });

  // Fetch invites data for summary statistics
  const { data: invites } = useQuery({
    queryKey: ['admin', 'invites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invites')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  // Role change mutation
  const roleChangeMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'admin' | 'sales_user' }) => {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, { newRole }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: "Role Updated",
        description: `User role successfully changed to ${newRole === 'admin' ? 'Admin' : 'Sales User'}.`,
      });
      setRoleChangeDialog({ isOpen: false });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      const emailMatch = user.email.toLowerCase().includes(searchEmail.toLowerCase());
      const roleMatch = roleFilter === 'all' || user.role === roleFilter;
      const statusMatch = statusFilter === 'all' || getUserStatus(user.last_login).status === statusFilter;
      
      return emailMatch && roleMatch && statusMatch;
    });
  }, [users, searchEmail, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  // Summary calculations including invite statistics
  const summaryStats = useMemo(() => {
    if (!users) return { totalUsers: 0, activeUsers: 0, adminUsers: 0, pendingInvites: 0 };
    
    const now = new Date();
    const pendingInvites = invites?.filter(invite => 
      !invite.used_at && new Date(invite.expires_at) > now
    ).length || 0;
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => getUserStatus(u.last_login).status === 'active').length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      pendingInvites
    };
  }, [users, invites]);

  
  // Selection handlers
  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      setSelectAll(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map(user => user.id));
      setSelectAll(true);
    } else {
      setSelectedUsers([]);
      setSelectAll(false);
    }
  };

  // Role change handlers
  const handleRoleChange = (user: UserWithCounts, newRole: 'admin' | 'sales_user') => {
    // Prevent self-demotion
    if (currentUser?.id === user.id && newRole === 'sales_user') {
      toast({
        title: "Cannot Change Own Role",
        description: "You cannot demote your own admin privileges.",
        variant: "destructive",
      });
      return;
    }

    setRoleChangeDialog({
      isOpen: true,
      user,
      newRole
    });
  };

  const confirmRoleChange = () => {
    if (roleChangeDialog.user && roleChangeDialog.newRole) {
      roleChangeMutation.mutate({
        userId: roleChangeDialog.user.id,
        newRole: roleChangeDialog.newRole
      });
    }
  };

  // Activity modal handlers
  const handleViewActivity = (user: UserWithCounts) => {
    setActivityModal({
      isOpen: true,
      userId: user.id,
      userName: user.email,
      userRole: user.role
    });
  };

  // Data export handler
  const handleDataExport = (user: UserWithCounts) => {
    toast({
      title: "Export Initiated",
      description: `Data export for ${user.email} will be available in the GDPR dashboard.`,
    });
  };

  // User deletion handler
  const handleUserDeletion = (user: UserWithCounts) => {
    // Prevent self-deletion
    if (currentUser?.id === user.id) {
      toast({
        title: "Cannot Delete Own Account",
        description: "You cannot delete your own admin account.",
        variant: "destructive",
      });
      return;
    }

    setDeletionDialog({
      isOpen: true,
      user
    });
  };

  // Bulk deletion handler
  const handleBulkDeletion = () => {
    if (selectedUsers.length === 0) return;

    const usersToDelete = paginatedUsers.filter(user => selectedUsers.includes(user.id));
    setBulkDeletionDialog({
      isOpen: true,
      users: usersToDelete
    });
  };

  // Clear selection after successful bulk operation
  const clearSelection = () => {
    setSelectedUsers([]);
    setSelectAll(false);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchEmail('');
    setRoleFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const hasFilters = searchEmail || roleFilter !== 'all' || statusFilter !== 'all';

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load users</p>
            <p className="text-gray-500 text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              System administrators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.pendingInvites}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting registration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Users Directory</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and monitor user accounts
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sales_user">Sales User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                  <SelectItem value="never">Never logged in</SelectItem>
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
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
              {hasFilters && ` (filtered from ${summaryStats.totalUsers} total)`}
            </p>
            
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedUsers.length} selected
                </span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export Selected
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleBulkDeletion}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
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
                  <div className="h-10 w-10 bg-gray-200 rounded-full" />
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
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const status = getUserStatus(user.last_login);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleUserSelect(user.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {user.email.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.email}</div>
                              <div className="text-sm text-muted-foreground">
                                Member since {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status.color}>
                            <span className="mr-1">{status.icon}</span>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.last_login ? (
                            <div className="text-sm">
                              {formatDistanceToNow(new Date(user.last_login), { addSuffix: true })}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">Never</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {user.transcript_count} transcripts, {user.account_count} accounts
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem onClick={() => handleViewActivity(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Activity
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDataExport(user)}>
                                <Download className="mr-2 h-4 w-4" />
                                Export User Data
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRoleChange(user, user.role === 'admin' ? 'sales_user' : 'admin')}
                              >
                                <UserCog className="mr-2 h-4 w-4" />
                                {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleUserDeletion(user)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Request Deletion
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + usersPerPage, filteredUsers.length)} of{' '}
                    {filteredUsers.length} users
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <ChangeRoleDialog
        isOpen={roleChangeDialog.isOpen}
        onClose={() => setRoleChangeDialog({ isOpen: false })}
        onConfirm={confirmRoleChange}
        userEmail={roleChangeDialog.user?.email || ''}
        currentRole={roleChangeDialog.user?.role || 'sales_user'}
        newRole={roleChangeDialog.newRole || 'sales_user'}
        isLoading={roleChangeMutation.isPending}
      />

      {/* Activity Modal */}
      {activityModal.userId && (
        <UserActivityModal
          userId={activityModal.userId}
          userName={activityModal.userName || ''}
          userRole={activityModal.userRole || 'sales_user'}
          isOpen={activityModal.isOpen}
          onClose={() => setActivityModal({ isOpen: false })}
        />
      )}

      {/* User Deletion Dialog */}
      {deletionDialog.user && (
        <UserDeletionDialog
          isOpen={deletionDialog.isOpen}
          onClose={() => setDeletionDialog({ isOpen: false })}
          user={deletionDialog.user}
        />
      )}

      {/* Bulk User Deletion Dialog */}
      <BulkUserDeletionDialog
        isOpen={bulkDeletionDialog.isOpen}
        onClose={() => {
          setBulkDeletionDialog({ isOpen: false, users: [] });
          clearSelection();
        }}
        users={bulkDeletionDialog.users}
      />
    </div>
  );
}
