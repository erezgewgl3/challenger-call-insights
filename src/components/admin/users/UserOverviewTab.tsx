
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  FileText, 
  Brain, 
  Building, 
  Clock, 
  Download, 
  UserCog,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'sales_user';
  created_at: string;
  transcript_count: number;
  analysis_count: number;
  account_count: number;
  last_activity: string | null;
}

interface UserOverviewTabProps {
  userId: string;
}

export function UserOverviewTab({ userId }: UserOverviewTabProps) {
  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          transcript_count:transcripts(count),
          analysis_count:transcripts!inner(
            conversation_analysis(count)
          ),
          account_count:accounts(count)
        `)
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Get last activity from transcripts
      const { data: lastTranscript } = await supabase
        .from('transcripts')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      return {
        ...data,
        transcript_count: data.transcript_count?.[0]?.count || 0,
        analysis_count: data.analysis_count?.[0]?.conversation_analysis?.[0]?.count || 0,
        account_count: data.account_count?.[0]?.count || 0,
        last_activity: lastTranscript?.created_at || null
      } as UserProfile;
    }
  });

  const getUserStatus = (profile: UserProfile) => {
    if (!profile.last_activity) return { status: 'never', label: 'Never active', color: 'bg-gray-100 text-gray-800' };
    
    const lastActivity = new Date(profile.last_activity);
    const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceActivity <= 7) return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-800' };
    if (daysSinceActivity <= 30) return { status: 'inactive', label: 'Inactive', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'dormant', label: 'Dormant', color: 'bg-red-100 text-red-800' };
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load user profile</p>
            <p className="text-gray-500 text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-lg">
            <div className="h-16 w-16 bg-gray-200 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 bg-gray-50 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!userProfile) return null;

  const status = getUserStatus(userProfile);

  return (
    <div className="space-y-6">
      {/* User Profile Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg font-semibold">
                  {userProfile.email.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{userProfile.email}</h2>
                <div className="flex items-center space-x-3 mt-2">
                  <Badge variant={userProfile.role === 'admin' ? 'default' : 'secondary'}>
                    {userProfile.role === 'admin' ? 'Admin' : 'Sales User'}
                  </Badge>
                  <Badge variant="outline" className={status.color}>
                    {status.label}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {formatDistanceToNow(new Date(userProfile.created_at), { addSuffix: true })}</span>
                  </div>
                  {userProfile.last_activity && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Last active {formatDistanceToNow(new Date(userProfile.last_activity), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                <UserCog className="h-4 w-4 mr-2" />
                Manage User
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transcripts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile.transcript_count}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Uploaded files</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyses Completed</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile.analysis_count}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>{userProfile.transcript_count > 0 ? Math.round((userProfile.analysis_count / userProfile.transcript_count) * 100) : 0}% success rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accounts Created</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile.account_count}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Client accounts</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Usage</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((Date.now() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24))}d
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Days since joining</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <UserCog className="h-6 w-6" />
              <span className="text-sm">Change Role</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Download className="h-6 w-6" />
              <span className="text-sm">Export Data</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" disabled>
              <span className="text-2xl">💬</span>
              <span className="text-sm">Send Message</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" disabled>
              <span className="text-2xl">🔐</span>
              <span className="text-sm">Reset Password</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
