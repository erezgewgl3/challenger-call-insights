import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Eye, Settings, AlertTriangle, CheckCircle, XCircle, MoreHorizontal, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface UserIntegrationStatus {
  userId: string;
  email: string;
  activeIntegrations: number;
  healthScore: number;
  lastActivity: string;
  issues: string[];
  apiUsage24h: number;
  webhookVolume24h: number;
}

interface UserIntegrationTableProps {
  userStatuses: UserIntegrationStatus[];
  onDisableIntegration?: (userId: string) => void;
  onViewDetails?: (userId: string) => void;
}

export function UserIntegrationTable({ 
  userStatuses, 
  onDisableIntegration,
  onViewDetails 
}: UserIntegrationTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserIntegrationStatus | null>(null);
  const [showDisableDialog, setShowDisableDialog] = useState<string | null>(null);

  const filteredUsers = userStatuses.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getHealthBadgeVariant = (score: number) => {
    if (score >= 90) return "default";
    if (score >= 70) return "secondary"; 
    return "destructive";
  };

  const getHealthStatusIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (score >= 70) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const handleExportUserData = () => {
    const csvContent = [
      ['Email', 'Active Integrations', 'Health Score', 'Last Activity', 'API Usage (24h)', 'Webhook Volume (24h)', 'Issues'],
      ...filteredUsers.map(user => [
        user.email,
        user.activeIntegrations.toString(),
        `${user.healthScore}%`,
        user.lastActivity,
        user.apiUsage24h.toString(),
        user.webhookVolume24h.toString(),
        user.issues.join('; ')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-integration-status-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Integration Status</CardTitle>
            <CardDescription>
              Monitor integration health across all users
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleExportUserData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Health Score</TableHead>
              <TableHead>Integrations</TableHead>
              <TableHead>Usage (24h)</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Issues</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.userId}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getHealthStatusIcon(user.healthScore)}
                    <span className="font-medium">{user.email}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant={getHealthBadgeVariant(user.healthScore)}>
                    {user.healthScore}%
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <span className="font-mono">{user.activeIntegrations}</span>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    <div>API: {user.apiUsage24h}</div>
                    <div className="text-muted-foreground">Hooks: {user.webhookVolume24h}</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm">{user.lastActivity}</span>
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.issues.slice(0, 2).map((issue, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {issue}
                      </Badge>
                    ))}
                    {user.issues.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.issues.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewDetails?.(user.userId)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </DropdownMenuItem>
                      {user.activeIntegrations > 0 && (
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setShowDisableDialog(user.userId)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Disable All
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* User Details Modal */}
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Integration Details - {selectedUser?.email}</DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Health Overview</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Health Score</span>
                        <Badge variant={getHealthBadgeVariant(selectedUser.healthScore)}>
                          {selectedUser.healthScore}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Integrations</span>
                        <span className="font-mono">{selectedUser.activeIntegrations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Activity</span>
                        <span>{selectedUser.lastActivity}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Usage (24h)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>API Calls</span>
                        <span className="font-mono">{selectedUser.apiUsage24h}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Webhooks</span>
                        <span className="font-mono">{selectedUser.webhookVolume24h}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedUser.issues.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Active Issues</h4>
                    <div className="space-y-2">
                      {selectedUser.issues.map((issue, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-destructive">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Disable Confirmation Dialog */}
        <AlertDialog open={!!showDisableDialog} onOpenChange={(open) => !open && setShowDisableDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disable All Integrations</AlertDialogTitle>
              <AlertDialogDescription>
                This will disable all active integrations for this user. They will need to reconnect 
                their integrations to resume functionality. This action can be reversed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (showDisableDialog) {
                    onDisableIntegration?.(showDisableDialog);
                    setShowDisableDialog(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Disable All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}