
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersOverview } from '@/components/admin/users/UsersOverview';

export default function UserManagement() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users, roles, and access control across your Sales Whisperer platform
          </p>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Users Overview</TabsTrigger>
            <TabsTrigger value="invites" disabled>
              Invite Management
            </TabsTrigger>
            <TabsTrigger value="analytics" disabled>
              Usage Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <UsersOverview />
          </TabsContent>

          <TabsContent value="invites">
            <div className="text-center py-12 text-gray-500">
              Invite Management - Coming Soon
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-12 text-gray-500">
              Usage Analytics - Coming Soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
