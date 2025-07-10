import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthLoading } from '@/components/ui/LoadingSpinner';
import WelcomeDashboard from './WelcomeDashboard';

export default function SmartDashboard() {
  const { loading } = useAuth();

  // Show loading spinner while determining user role
  if (loading) {
    return <AuthLoading message="Loading dashboard..." />;
  }

  // This component now only handles sales users since admin users
  // are redirected to /admin during login
  return <WelcomeDashboard />;
}