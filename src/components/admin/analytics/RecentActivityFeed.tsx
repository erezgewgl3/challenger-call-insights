
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'user_registration' | 'transcript_upload' | 'analysis_completed' | 'system_alert' | 'user_login';
  user?: {
    email: string;
    initials: string;
  };
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface RecentActivityFeedProps {
  limit?: number;
}

export function RecentActivityFeed({ limit = 10 }: RecentActivityFeedProps) {
  // Mock data - replace with actual API call
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'user_registration',
      user: { email: 'john@example.com', initials: 'JD' },
      description: 'New user registered',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      status: 'success'
    },
    {
      id: '2',
      type: 'transcript_upload',
      user: { email: 'sarah@example.com', initials: 'SM' },
      description: 'Uploaded transcript "Sales Call with Acme Corp"',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      status: 'info'
    },
    {
      id: '3',
      type: 'analysis_completed',
      user: { email: 'mike@example.com', initials: 'MJ' },
      description: 'AI analysis completed with high confidence scores',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: 'success'
    },
    {
      id: '4',
      type: 'system_alert',
      description: 'API response time increased above threshold',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      status: 'warning'
    },
  ];

  const getStatusColor = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registration': return '👤';
      case 'transcript_upload': return '📄';
      case 'analysis_completed': return '🤖';
      case 'system_alert': return '⚠️';
      case 'user_login': return '🔐';
      default: return 'ℹ️';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, limit).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                {activity.user ? (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{activity.user.initials}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-full text-sm">
                    {getTypeIcon(activity.type)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.user?.email || 'System'}
                  </p>
                  <Badge variant="outline" className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
