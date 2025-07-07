
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateInviteForm } from './CreateInviteForm';
import { InvitesTable } from './InvitesTable';
import { Separator } from '@/components/ui/separator';

export interface Invite {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  created_by: string;
  created_by_user?: {
    email: string;
  };
}

export interface InviteFilters {
  status: 'all' | 'pending' | 'used' | 'expired' | 'expiring';
  emailSearch: string;
}

export function InviteManagement() {
  const [filters, setFilters] = useState<InviteFilters>({
    status: 'all',
    emailSearch: ''
  });

  const { data: invites, isLoading, error } = useQuery({
    queryKey: ['admin', 'invites', filters],
    queryFn: async () => {
      let query = supabase
        .from('invites')
        .select(`
          *,
          created_by_user:users!created_by(email)
        `)
        .order('created_at', { ascending: false });

      if (filters.emailSearch) {
        query = query.ilike('email', `%${filters.emailSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Invite[];
    },
    refetchInterval: 30 * 1000 // Refresh every 30 seconds for real-time updates
  });

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load invites</p>
            <p className="text-gray-500 text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create Invite Form - Left Column */}
      <div className="lg:col-span-1">
        <CreateInviteForm />
      </div>

      {/* Vertical Separator */}
      <div className="hidden lg:flex items-center">
        <Separator orientation="vertical" className="h-full" />
      </div>

      {/* Invites Table - Right Columns */}
      <div className="lg:col-span-2">
        <InvitesTable 
          invites={invites || []}
          isLoading={isLoading}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
    </div>
  );
}
