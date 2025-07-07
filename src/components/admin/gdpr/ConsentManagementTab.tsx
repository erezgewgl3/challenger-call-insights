
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, AlertTriangle, XCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ConsentDetailsModal } from './ConsentDetailsModal';

interface UserWithConsent {
  id: string;
  email: string;
  created_at: string;
  consent?: {
    id: string;
    consent_date: string;
    consent_version: string;
    granular_consents: {
      transcriptProcessing: boolean;
      dataAnalytics: boolean;
      emailCommunications: boolean;
      marketingCommunications: boolean;
      thirdPartySharing: boolean;
    };
    legal_basis: string;
    withdrawal_date?: string;
    renewal_required: boolean;
    last_updated: string;
  };
}

const getConsentStatus = (user: UserWithConsent) => {
  if (!user.consent) {
    return { status: 'none', label: 'No Consent', color: 'bg-gray-100 text-gray-800', icon: XCircle };
  }
  
  if (user.consent.withdrawal_date) {
    return { status: 'withdrawn', label: 'Withdrawn', color: 'bg-red-100 text-red-800', icon: XCircle };
  }
  
  if (user.consent.renewal_required) {
    return { status: 'renewal', label: 'Renewal Required', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle };
  }
  
  return { status: 'valid', label: 'Valid', color: 'bg-green-100 text-green-800', icon: CheckCircle };
};

export function ConsentManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  const { data: usersWithConsent, isLoading } = useQuery({
    queryKey: ['gdpr', 'users-consent'],
    queryFn: async (): Promise<UserWithConsent[]> => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          created_at,
          consent:user_consent(
            id,
            consent_date,
            consent_version,
            granular_consents,
            legal_basis,
            withdrawal_date,
            renewal_required,
            last_updated
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(user => ({
        ...user,
        consent: user.consent?.[0] || undefined
      }));
    }
  });

  const renewConsentMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_consent')
        .upsert({
          user_id: userId,
          consent_date: new Date().toISOString(),
          consent_version: '1.1',
          renewal_required: false,
          last_updated: new Date().toISOString()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gdpr', 'users-consent'] });
      toast({
        title: "Consent Renewed",
        description: "User consent has been successfully renewed.",
      });
    }
  });

  // Calculate summary statistics
  const consentStats = usersWithConsent?.reduce(
    (acc, user) => {
      const status = getConsentStatus(user).status;
      switch (status) {
        case 'valid': acc.valid++; break;
        case 'renewal': acc.renewalRequired++; break;
        case 'withdrawn': acc.withdrawn++; break;
        case 'none': acc.neverConsented++; break;
      }
      return acc;
    },
    { valid: 0, renewalRequired: 0, withdrawn: 0, neverConsented: 0 }
  ) || { valid: 0, renewalRequired: 0, withdrawn: 0, neverConsented: 0 };

  const handleManageConsent = (userId: string) => {
    setSelectedUserId(userId);
    setConsentModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Valid Consent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{consentStats.valid}</div>
            <p className="text-xs text-muted-foreground">Active and compliant</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Renewal Required</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{consentStats.renewalRequired}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Withdrawn</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{consentStats.withdrawn}</div>
            <p className="text-xs text-muted-foreground">Consent withdrawn</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Never Consented</CardTitle>
            <User className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{consentStats.neverConsented}</div>
            <p className="text-xs text-muted-foreground">No consent record</p>
          </CardContent>
        </Card>
      </div>

      {/* Consent Management Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Consent Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Monitor and manage user consent for data processing activities
          </p>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Consent Status</TableHead>
                <TableHead>Legal Basis</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersWithConsent?.map((user) => {
                const consentInfo = getConsentStatus(user);
                const StatusIcon = consentInfo.icon;
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">{user.email}</div>
                          <div className="text-sm text-muted-foreground">
                            Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={consentInfo.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {consentInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.consent?.legal_basis || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      {user.consent?.last_updated 
                        ? formatDistanceToNow(new Date(user.consent.last_updated), { addSuffix: true })
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      {user.consent?.consent_version || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageConsent(user.id)}
                        >
                          Manage
                        </Button>
                        {consentInfo.status === 'renewal' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => renewConsentMutation.mutate(user.id)}
                            disabled={renewConsentMutation.isPending}
                          >
                            Renew
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!usersWithConsent || usersWithConsent.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Consent Details Modal */}
      {selectedUserId && (
        <ConsentDetailsModal
          userId={selectedUserId}
          isOpen={consentModalOpen}
          onClose={() => {
            setConsentModalOpen(false);
            setSelectedUserId(null);
          }}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['gdpr', 'users-consent'] });
          }}
        />
      )}
    </div>
  );
}
