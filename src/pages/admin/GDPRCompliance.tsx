
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataRequestsTab } from '@/components/admin/gdpr/DataRequestsTab';
import { DataRetentionTab } from '@/components/admin/gdpr/DataRetentionTab';
import { ConsentManagementTab } from '@/components/admin/gdpr/ConsentManagementTab';
import { AuditTrailTab } from '@/components/admin/gdpr/AuditTrailTab';

export default function GDPRCompliance() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GDPR Compliance</h1>
          <p className="text-gray-600 mt-1">
            Data protection and privacy management for Sales Whisperer platform
          </p>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requests">Data Requests</TabsTrigger>
            <TabsTrigger value="retention">Data Retention</TabsTrigger>
            <TabsTrigger value="consent">Consent Management</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <DataRequestsTab />
          </TabsContent>

          <TabsContent value="retention" className="space-y-6">
            <DataRetentionTab />
          </TabsContent>

          <TabsContent value="consent" className="space-y-6">
            <ConsentManagementTab />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AuditTrailTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
