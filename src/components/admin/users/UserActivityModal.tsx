
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, User, Activity, BarChart3, Building } from 'lucide-react';
import { UserOverviewTab } from './UserOverviewTab';
import { ActivityTimelineTab } from './ActivityTimelineTab';
import { UsageAnalyticsTab } from './UsageAnalyticsTab';
import { AccountManagementTab } from './AccountManagementTab';

interface UserActivityModalProps {
  userId: string;
  userName: string;
  userRole: 'admin' | 'sales_user';
  isOpen: boolean;
  onClose: () => void;
}

export function UserActivityModal({ 
  userId, 
  userName, 
  userRole, 
  isOpen, 
  onClose 
}: UserActivityModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[90vw] h-[90vh] max-h-[900px] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  User Activity Details
                </DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-muted-foreground">{userName}</span>
                  <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
                    {userRole === 'admin' ? 'Admin' : 'Sales User'}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-6 mt-4 grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Timeline
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Usage Analytics
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Account Management
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto p-6">
              <TabsContent value="overview" className="mt-0 h-full">
                <UserOverviewTab userId={userId} onTabChange={setActiveTab} />
              </TabsContent>

              <TabsContent value="timeline" className="mt-0 h-full">
                <ActivityTimelineTab userId={userId} />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0 h-full">
                <UsageAnalyticsTab userId={userId} />
              </TabsContent>

              <TabsContent value="accounts" className="mt-0 h-full">
                <AccountManagementTab userId={userId} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
