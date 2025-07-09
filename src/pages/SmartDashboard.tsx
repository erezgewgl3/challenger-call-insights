import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthLoading } from '@/components/ui/LoadingSpinner';
import WelcomeDashboard from './WelcomeDashboard';
import UserManagement from './admin/UserManagement';
import { Button } from '@/components/ui/button';
import { Users, BarChart3, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SmartDashboard() {
  const { user, loading, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<'sales' | 'admin'>('sales');

  // Show loading spinner while determining user role
  if (loading) {
    return <AuthLoading message="Loading dashboard..." />;
  }

  // If user is admin, show admin view by default, otherwise show sales dashboard
  const defaultView = isAdmin ? 'admin' : 'sales';
  const activeView = isAdmin ? currentView : 'sales';

  // For sales users, just show the welcome dashboard
  if (!isAdmin) {
    return <WelcomeDashboard />;
  }

  // For admin users, show role-based navigation and appropriate view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Admin Navigation Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Sales Whisperer</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={activeView === 'admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('admin')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                User Management
              </Button>
              <Button
                variant={activeView === 'sales' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('sales')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Sales Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {activeView === 'admin' ? <UserManagement /> : <WelcomeDashboard />}
      </div>
    </div>
  );
}