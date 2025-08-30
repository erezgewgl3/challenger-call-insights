import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, User, Shield, Eye } from 'lucide-react';

interface DemoLoginCardProps {
  onDemoLogin: (role: 'sales_user' | 'admin') => void;
  loading?: boolean;
}

export function DemoLoginCard({ onDemoLogin, loading = false }: DemoLoginCardProps) {
  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl text-slate-900">Preview Mode</CardTitle>
        <CardDescription>
          Test the Sales Whisperer platform with demo accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Button 
            onClick={() => onDemoLogin('sales_user')} 
            disabled={loading}
            className="w-full justify-start h-auto p-4 bg-white hover:bg-gray-50 text-left border border-gray-200 shadow-sm"
            variant="outline"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900">Sales User Demo</span>
                  <Badge variant="secondary" className="text-xs">SALES</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  Experience transcript analysis, AI coaching, and deal tracking
                </p>
              </div>
            </div>
          </Button>

          <Button 
            onClick={() => onDemoLogin('admin')} 
            disabled={loading}
            className="w-full justify-start h-auto p-4 bg-white hover:bg-gray-50 text-left border border-gray-200 shadow-sm"
            variant="outline"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900">Admin Demo</span>
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">ADMIN</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  Access user management, analytics, and system configuration
                </p>
              </div>
            </div>
          </Button>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Play className="h-3 w-3" />
            <span>Demo accounts include sample data for testing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}